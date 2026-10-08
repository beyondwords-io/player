import translate from "./translate";
import { writable } from "svelte/store";
import type { Subscriber, Writable } from "svelte/store";
import type AuthApiClient from "../api_clients/authApiClient";
import type { AgentSession } from "../api_clients/authApiClient";
import type {
  AgentCitation,
  AgentClient,
  AgentEndReason,
  AgentReplyMessage,
  AgentSessionConfig,
  AgentSessionOptions,
  AgentState,
} from "./agentContracts";
import { layoutAgentReply } from "./agentCitations";
import { agentCitationsFromToolResult, mergeAgentCitations } from "./agentLinks";

// The live agent client for the default player's Chat/Talk surfaces, backed by
// the ElevenLabs Agents SDK.
// The player selects this client when the project serves an agent id
// (conversational_agent.elevenlabs_agent_id in /player, or the agentId prop).
//
// The SDK itself stays out of the base bundle: it is loaded on the first
// startSession, and the behaviour suite can swap it for a stub through
// window.__elevenLabsClientStub.
//
// The agent is private, so every session starts with a credential from the
// BeyondWords auth service (AuthApiClient.agentSession): a signed websocket
// url for text, a WebRTC conversation token for voice. The agent id only says
// that the project has an agent; it is never sent to the SDK.
//
// SDK -> thread mapping notes:
// - Text replies stream through onAgentChatResponsePart (start/delta/stop,
//   correlated by event_id). Voice replies usually land whole through
//   onMessage; alignment-paced reveal for spoken replies is a later phase.
// - There is no client-side interrupt in the SDK: in a call the reader speaks
//   over the agent (server VAD). canInterrupt tells the panel not to offer a
//   tap-to-interrupt, and interrupt() only stops the local text reveal.
// - A tool-using turn is a bridge ("Let me have a look"), the tool call, then
//   the answer, all under one event_id. Each reply has its own response_id,
//   which the parts carry but SDK 1.17's onMessage drops; a bridge's whole
//   message also arrives before its own parts. So without a response_id a
//   whole message matches a streamed reply by its words, never by event_id
//   alone.
// - Tool results reach us through onMCPToolCall; onAgentToolResponse carries
//   them only if the agent sends full tool payloads. They are not tied to a
//   reply: they pool as sources, and each answer cites the ones it names.

const SILENCE_TIMEOUT_MS = 30_000;

// Plenty for a long session of rundowns and searches.
const MAX_SOURCES = 200;

// The platform strips Markdown emphasis and headings from a whole
// agent_response but not from the parts that streamed the same reply.
const plainAgentText = (text: string): string => (text ?? "").replace(/[*#]/g, "").replace(/\s+/g, " ").trim();
const sameAgentText = (a: string, b: string): boolean => plainAgentText(a) === plainAgentText(b);
const agentTextStartsWith = (text: string, start: string): boolean => plainAgentText(text).startsWith(plainAgentText(start));

// A parts stream that, so far, repeats a whole message already on screen.
interface ShadowStream {
  reply: AgentReplyMessage;
  text: string;
  eventId?: number;
  responseId?: string;
}

interface AgentConversation {
  endSession?: () => Promise<void> | void;
  sendUserActivity?: () => void;
  sendUserMessage: (text: string) => void;
  setMicMuted?: (muted: boolean) => void;
}

interface ElevenLabsAgentSdk {
  Conversation: {
    startSession: (options: unknown) => Promise<AgentConversation>;
  };
}

interface RealAgentClientOptions {
  agentId?: string;
  authClient?: AuthApiClient;
  sessionConfig?: AgentSessionConfig;
  dynamicVariables?: () => Record<string, unknown>;
  loadSdk?: () => Promise<ElevenLabsAgentSdk>;
  silenceTimeoutMs?: number;
}

class RealAgentClient implements AgentClient {
  agentId: string | undefined;
  authClient: AuthApiClient | undefined;
  agentSessionConfig: AgentSessionConfig;
  sessionConfigKey: string;
  dynamicVariables: (() => Record<string, unknown>) | undefined;
  loadSdk: () => Promise<ElevenLabsAgentSdk>;
  silenceTimeoutMs: number;
  canInterrupt = false;

  state: AgentState;

  store: Writable<AgentState>;
  silenceTimer: ReturnType<typeof setTimeout> | null;

  #conversation: AgentConversation | null = null;
  #queued: string[] = [];
  #epoch = 0;
  #partTurnId: number | null = null;
  #shadow: ShadowStream | null = null;
  #resentResponseIds = new Set<string>();
  #interruptedTurnIds = new Set<number>();
  #ignoreNextAgentTurn = false;
  #ignoreNextUncorrelatedWholeMessage = false;
  #unanswered: string[] = [];
  #sources: AgentCitation[] = [];
  #turnSources: AgentCitation[] = [];
  #fallbacks = new WeakMap<AgentReplyMessage, AgentCitation | null>();
  #greetingOverrideSent = false;
  #greetingOverrideRejected = false;

  constructor({ agentId, authClient, sessionConfig, dynamicVariables, loadSdk, silenceTimeoutMs }: RealAgentClientOptions = {}) {
    this.agentId = agentId;
    this.authClient = authClient;
    this.agentSessionConfig = sessionConfig || {};
    this.sessionConfigKey = JSON.stringify(this.agentSessionConfig);
    this.dynamicVariables = dynamicVariables;
    this.loadSdk = loadSdk ?? defaultLoadSdk;

    this.silenceTimeoutMs = silenceTimeoutMs
      ?? (typeof window !== "undefined" && (window as { __agentSilenceTimeoutMs?: number }).__agentSilenceTimeoutMs)
      ?? SILENCE_TIMEOUT_MS;

    this.state = { kind: "none", status: "idle", muted: false, thread: [], announced: "" };
    this.store = writable(this.state);
    this.silenceTimer = null;
  }

  subscribe(run: Subscriber<AgentState>): () => void {
    return this.store.subscribe(run);
  }

  // A session starts on the first user act, never on opening the panel.
  // Switching kinds ends the live conversation first: text and voice are
  // separate conversations on the platform too, so nothing carries over.
  async startSession({ textOnly = false }: AgentSessionOptions = {}): Promise<void> {
    if (!this.agentId) {
      console.warn("BeyondWords.Player cannot start an agent session without an agentId.");
      return;
    }

    if (!this.authClient) throw new Error("no auth client to start an agent session with");

    const kind = textOnly ? "text" : "voice";
    if (this.state.kind === kind) { return; }

    if (this.state.kind !== "none") { this.endSession("switched"); }

    const epoch = this.#epoch;

    this.state.kind = kind;

    // The mic permission and the connection both live in this gap; Cancel
    // abandons before anything starts. Text shows no connection state at all.
    if (!textOnly) {
      this.state.status = "connecting";
      this.state.muted = false;
    }

    this.#notify();

    try {
      const [{ Conversation }, session] = await Promise.all([this.loadSdk(), this.authClient.agentSession(kind)]);
      if (epoch !== this.#epoch) { return; }

      const conversation = await Conversation.startSession(this.#sessionConfig(epoch, textOnly, session));

      // Ended or cancelled while connecting: the session opened, so close it.
      if (epoch !== this.#epoch) {
        const ending = conversation.endSession?.();
        if (ending instanceof Promise) { ending.catch(() => {}); }
        return;
      }

      this.#conversation = conversation;
      this.#flushQueued();
    } catch (error) {
      if (epoch !== this.#epoch) { return; }

      console.warn(`BeyondWords.Player agent session failed: ${error}`);
      this.#resetToIdle();

      // A failed connect never started, so like Cancel it leaves no mark; a
      // reply bubble that never got any text goes with it.
      this.#dropEmptyReply();
      this.#notify();
    }
  }

  // Typed asks work inside a voice call - same conversation, replies stay
  // spoken. Sending over a reply starts a new turn; the server interrupts the
  // agent for us, we just close the on-screen reveal.
  sendUserMessage(text: string): void {
    if (!this.agentId) {
      console.warn("BeyondWords.Player cannot send an agent message without an agentId.");
      return;
    }

    if (this.state.kind === "none") { this.startSession({ textOnly: true }); }

    // A reply that has text stays, cut short; one that never got any goes -
    // the platform will answer the newest question in the fresh bubble.
    this.#dropEmptyReply();
    const pending = this.#streamingReply();
    if (pending) { this.#finalizeReply(pending, { interrupted: true }); }

    // A stream still hidden behind an earlier reply belongs to the old turn.
    if (this.#shadow) {
      this.#shadow = null;
      this.#partTurnId = null;
    }

    this.#turnSources = [];

    const reply: AgentReplyMessage = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice", sessionEpoch: this.#epoch };
    this.state.thread = [...this.state.thread, { role: "reader", text }, reply];
    this.#disarmSilenceTimer();
    this.#notify();

    // Kept until a reply lands, so a rejected session start can replay them.
    this.#unanswered.push(text);

    if (this.#conversation) {
      this.#conversation.sendUserMessage(text);
    } else {
      this.#queued.push(text);
    }
  }

  // Keystrokes: the agent holds instead of talking over you.
  sendUserActivity(): void {
    this.#conversation?.sendUserActivity?.();
    if (this.state.kind === "voice") { this.#armSilenceTimer(); }
  }

  setMicMuted(muted: boolean): void {
    if (this.state.kind !== "voice") { return; }

    this.#conversation?.setMicMuted?.(muted);
    this.state.muted = muted;
    this.#notify();
    this.#armSilenceTimer();
  }

  // The SDK has no client-side interrupt - speaking over the agent is the
  // interrupt - so this only stops the local reveal of a text reply.
  interrupt(): void {
    const pending = this.#streamingReply();
    if (!pending) { return; }

    const { eventId, fromParts, text } = pending as { eventId?: number; fromParts?: boolean; text?: string };

    if (fromParts) {
      if (eventId !== undefined && eventId !== null) { this.#interruptedTurnIds.add(eventId); }
      this.#ignoreNextUncorrelatedWholeMessage = true;
    } else {
      // Stop can be pressed while the typing dots are still waiting for the
      // SDK's start event. Suppress that next turn once its id is known.
      this.#ignoreNextAgentTurn = true;
    }

    if (text) {
      this.#finalizeReply(pending, { interrupted: true });
    } else {
      this.#dropEmptyReply();
      this.#partTurnId = null;
    }

    this.#notify();
  }

  // The End pill, the widget's x, teardown, or the silence timeout. Ending
  // keeps the thread; a voice call marks where it stopped.
  endSession(reason: AgentEndReason = "ended"): void {
    if (this.state.kind === "none") { return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.#finalizeReply(this.#streamingReply(), { interrupted: true });
    this.#resetToIdle();

    if (wasVoice && reason !== "switched") {
      this.state.thread = [...this.state.thread, { role: "divider", text: translate("chatEnded") }];
    }

    this.#notify();
  }

  // Cancel during "Connecting…": nothing started, nothing to mark. If the
  // session resolves after this, startSession sees the stale epoch and
  // closes it.
  cancelConnect(): void {
    if (this.state.status !== "connecting") { return; }

    this.#resetToIdle();
    this.#notify();
  }

  // A locked agent takes the question without a session and answers with the
  // publisher's offer; the panel supplies no copy of its own.
  appendLocked(text: string): void {
    this.state.thread = [...this.state.thread, { role: "reader", text }, { role: "locked" }];
    this.#notify();
  }

  // private

  #sessionConfig(epoch, textOnly, session: AgentSession) {
    const guarded = (handler) => (payload) => {
      if (epoch !== this.#epoch) { return; }
      handler(payload);
    };

    // The reader types first in a text chat, so the configured greeting would
    // arrive as a non-answer after their question: this channel suppresses it.
    // Voice keeps it - the agent speaking first is what starting a call means.
    // Suppression needs the first-message override enabled in the agent's
    // security settings; when the platform says no, #handleDisconnected
    // reconnects without it and the greeting shows as before.
    this.#greetingOverrideSent = textOnly && !this.#greetingOverrideRejected;

    const overrides = this.#overrides(textOnly);

    return {
      ...(session.connection_type === "webrtc"
        ? { connectionType: "webrtc", conversationToken: session.conversation_token }
        : { connectionType: "websocket", signedUrl: session.signed_url }),
      ...(textOnly ? { textOnly: true } : {}),
      ...(Object.keys(overrides).length ? { overrides } : {}),
      ...this.#dynamicVariablesConfig(),
      onStatusChange: guarded(({ status }) => this.#handleStatusChange(status)),
      onModeChange: guarded(({ mode }) => this.#handleModeChange(mode)),
      onMessage: guarded(({ message, role, source, event_id: eventId, response_id: responseId }) => this.#handleMessage(message, role || source, eventId, responseId)),
      onAgentChatResponsePart: guarded((part) => this.#handleResponsePart(part)),
      onMCPToolCall: guarded((event) => this.#handleMCPToolCall(event)),
      onAgentToolResponse: guarded((event) => this.#handleAgentToolResponse(event)),
      onAgentResponseCorrection: guarded((event) => this.#handleCorrection(event)),
      onDisconnect: guarded((details) => this.#handleDisconnected(details)),
      onError: (message, context) => console.warn(`BeyondWords.Player agent error: ${message}`, context),
    };
  }

  #overrides(textOnly) {
    const config = this.agentSessionConfig;

    const prompt = Object.fromEntries(Object.entries({
      prompt: config.systemPrompt,
      llm: config.model,
    }).filter(([, value]) => typeof value === "string" && value.length > 0));

    const agent = Object.fromEntries(Object.entries({
      ...(Object.keys(prompt).length ? { prompt } : {}),
      firstMessage: this.#greetingOverrideSent && textOnly ? "" : config.firstMessage,
      language: config.language,
    }).filter(([, value]) => typeof value !== "undefined"));

    const tts = typeof config.voiceId === "string" && config.voiceId
      ? { voiceId: config.voiceId }
      : {};

    return {
      ...(Object.keys(agent).length ? { agent } : {}),
      ...(Object.keys(tts).length ? { tts } : {}),
    };
  }

  // Per-page context the publisher's agent can use in its prompt. Values are
  // read at session start, once the content has loaded.
  #dynamicVariablesConfig() {
    const entries = Object.entries(this.dynamicVariables?.() ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, typeof value === "number" || typeof value === "boolean" ? value : String(value)]);

    if (entries.length === 0) { return {}; }

    return { dynamicVariables: Object.fromEntries(entries) };
  }

  #handleStatusChange(status) {
    // Text sessions show no connection state, ever.
    if (this.state.kind !== "voice") { return; }

    if (status === "connected") {
      if (this.#conversationRows() > 0) {
        this.state.thread = [...this.state.thread, { role: "divider", text: translate("newVoiceChat") }];
      }

      this.state.status = "listening";
      this.#notify();
      this.#armSilenceTimer();
    }

    if (status === "disconnected") { this.#handleDisconnected(); }
  }

  #handleModeChange(mode) {
    if (this.state.kind !== "voice" || this.state.status === "connecting") { return; }

    this.state.status = mode === "speaking" ? "talking" : "listening";
    this.#notify();

    if (mode === "speaking") { this.#disarmSilenceTimer(); } else { this.#armSilenceTimer(); }
  }

  // Voice transcripts land per utterance once the reader finishes - there is
  // no word-by-word transcript. Agent turns fill the pending reply if one is
  // on screen, otherwise they append whole.
  #handleMessage(message, role, eventId, responseId = undefined) {
    if (role === "user") {
      // A just-typed message echoed back is not a second row.
      const recent = this.state.thread.slice(-2) as { role?: string; text?: string }[];
      if (recent.some((row) => row.role === "reader" && row.text === message)) { return; }

      this.state.thread = [...this.state.thread, { role: "reader", text: message }];
      this.#turnSources = [];
      this.#notify();
      this.#armSilenceTimer();
      return;
    }

    // The platform sends an empty agent_response while its tools run; there
    // is nothing to render, and the pending bubble stays open for the answer.
    if (!message || !message.trim()) { return; }

    // A whole agent_response repeats a streamed reply - after its parts for an
    // answer, before them for a bridge. Correlate it to that reply rather than
    // suppressing all whole messages for the rest of the session: later turns
    // (and later sessions) may use the whole-message fallback instead.
    const replies = this.#replies();

    if (this.#ignoreNextAgentTurn) {
      this.#ignoreNextAgentTurn = false;
      if (eventId !== undefined && eventId !== null) { this.#interruptedTurnIds.add(eventId); }
      return;
    }

    if (eventId !== undefined && eventId !== null && this.#interruptedTurnIds.has(eventId)) {
      this.#ignoreNextUncorrelatedWholeMessage = false;
      return;
    }

    if ((eventId === undefined || eventId === null) && this.#ignoreNextUncorrelatedWholeMessage) {
      this.#ignoreNextUncorrelatedWholeMessage = false;
      return;
    }

    // A turn cut off locally stays cut off, whatever else arrives for it.
    const latestPartsReply = eventId === undefined || eventId === null
      ? null
      : [...replies].reverse().find((reply) => reply.fromParts && reply.eventId === eventId);

    if (latestPartsReply?.interrupted) { return; }

    // SDK 1.26+ passes the reply's response_id along; 1.17 does not.
    const sameReply = (responseId ? replies.find((reply) => reply.responseId === responseId) : null)
      ?? this.#streamedReplyFor(replies, message, eventId, responseId);

    if (sameReply?.interrupted) { return; }

    if (sameReply) {
      const changed = sameReply.text !== message || sameReply.streaming;
      sameReply.text = message;
      this.#finalizeReply(sameReply);
      if (changed) { this.#notify(); }
      return;
    }

    const pending = this.#streamingReply();

    if (pending && pending.text === "") {
      // The text is the whole message's now, so its own parts stream - which
      // may follow - can be recognised as a repeat.
      pending.typing = false;
      pending.text = message;
      pending.eventId = eventId;
      pending.responseId = responseId;
      pending.fromParts = false;
      pending.sessionEpoch = this.#epoch;
      this.#finalizeReply(pending);
    } else if (!pending) {
      const reply: AgentReplyMessage = { role: "agent", text: message, citations: [], streaming: false, typing: false, spoken: this.state.kind === "voice", eventId, responseId, sessionEpoch: this.#epoch };
      this.state.thread = [...this.state.thread, reply];
      this.#layOut(reply);
      this.state.announced = message;
    } else {
      // A parts-built reply is mid-stream; the whole-message event is the
      // same text again, so let the stream finish it.
      return;
    }

    this.#notify();
  }

  // Text replies arrive as a start/delta/stop stream, correlated by event_id
  // so a turn we cut off locally cannot leak into the next reply.
  #handleResponsePart({ text, type, event_id: eventId, response_id: responseId }) {
    if (type === "start") {
      // A reply already on screen under this response_id: a resend.
      if (responseId && this.#replies().some((reply) => reply.responseId === responseId && !reply.streaming)) {
        this.#resentResponseIds.add(responseId);
        return;
      }

      this.#partTurnId = eventId ?? -1;
      this.#shadow = null;

      if (this.#ignoreNextAgentTurn) {
        this.#ignoreNextAgentTurn = false;
        if (eventId !== undefined && eventId !== null) { this.#interruptedTurnIds.add(eventId); }
        this.#ignoreNextUncorrelatedWholeMessage = true;
        return;
      }

      if (eventId !== undefined && eventId !== null && this.#interruptedTurnIds.has(eventId)) { return; }

      // A bridge's whole message lands before its own stream, and SDK 1.17
      // gives the message no response_id. Follow the stream out of sight
      // while it repeats that message, rather than show it twice.
      const latest = this.#turnReplies().at(-1);
      if (latest && !latest.streaming && !latest.fromParts && !latest.responseId && latest.text && latest.eventId === eventId) {
        this.#shadow = { reply: latest, text: "", eventId, responseId };
        return;
      }

      if (!this.#streamingReply()) {
        const reply: AgentReplyMessage = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice", sessionEpoch: this.#epoch };
        this.state.thread = [...this.state.thread, reply];
        this.#notify();
      }

      const pending = this.#streamingReply();
      pending.eventId = eventId;
      pending.responseId = responseId;
      pending.fromParts = true;
      pending.sessionEpoch = this.#epoch;

      return;
    }

    if (responseId && this.#resentResponseIds.has(responseId)) { return; }

    if (eventId !== undefined && eventId !== null && this.#interruptedTurnIds.has(eventId)) {
      if (type === "stop") { this.#partTurnId = null; }
      return;
    }

    if ((eventId ?? -1) !== this.#partTurnId) { return; }

    if (this.#shadow) {
      this.#handleShadowPart(type, text);
      return;
    }

    const pending = this.#streamingReply();
    if (!pending) { this.#partTurnId = null; return; }

    if (type === "delta") {
      pending.typing = false;
      pending.text += text ?? "";
      this.#notify();
    }

    if (type === "stop") {
      // The platform closes an empty turn while its tools run, then restarts
      // the same event_id with the answer: the reply stays open until then.
      if (!pending.text) { return; }

      this.#partTurnId = null;
      this.#finalizeReply(pending);
      this.#notify();
    }
  }

  // A shadowed stream that ends on the same words is the reply on screen, and
  // takes nothing else from it. One whose words part ways is a reply of its
  // own, shown from what it has said so far.
  #handleShadowPart(type, text) {
    const shadow = this.#shadow;

    if (type === "delta") {
      shadow.text += text ?? "";
      if (agentTextStartsWith(shadow.reply.text, shadow.text)) { return; }

      this.#shadow = null;
      const reply: AgentReplyMessage = { role: "agent", text: shadow.text, citations: [], streaming: true, typing: false, spoken: this.state.kind === "voice", eventId: shadow.eventId, responseId: shadow.responseId, fromParts: true, sessionEpoch: this.#epoch };
      this.state.thread = [...this.state.thread, reply];
      this.#notify();
      return;
    }

    if (type === "stop") {
      this.#shadow = null;
      this.#partTurnId = null;

      // An empty stream (tools running) says nothing about the reply.
      if (!plainAgentText(shadow.text)) { return; }

      shadow.reply.responseId = shadow.responseId;
      shadow.reply.fromParts = true;
    }
  }

  // Without a response_id (SDK 1.17), a whole message is a streamed reply of
  // the same turn only when its words are: a turn's bridge and its answer
  // share an event_id, and one must never overwrite the other.
  #streamedReplyFor(replies: AgentReplyMessage[], message: string, eventId, responseId): AgentReplyMessage | null {
    const candidates = eventId === undefined || eventId === null
      // Older SDK events can omit event_id: only the latest reply can match.
      ? replies.slice(-1).filter((reply) => reply.fromParts)
      : replies.filter((reply) => reply.eventId === eventId && (reply.fromParts || reply === this.#shadow?.reply));

    return [...candidates].reverse().find((reply) => (
      (!responseId || !reply.responseId)
      && (sameAgentText(reply.text, message) || (reply.streaming && reply.text && agentTextStartsWith(message, reply.text)))
    )) ?? null;
  }

  // The agent withdrew part of an answer (usually after an interruption);
  // what is on screen follows suit.
  #handleCorrection({ corrected_agent_response: corrected, original_agent_response: original, event_id: eventId }) {
    if (typeof corrected !== "string") { return; }

    const replies = this.#replies();
    const reply = (eventId === undefined || eventId === null
      ? null
      : [...replies].reverse().find((row) => row.eventId === eventId))
      ?? (typeof original === "string" ? [...replies].reverse().find((row) => row.text === original) : null);

    // A delayed correction must never land in a newer turn's pending bubble.
    if (!reply || reply.interrupted) { return; }

    const announcedReply = [...replies].reverse().find((row) => !row.streaming && row.text === this.state.announced);
    reply.text = corrected;
    if (!reply.streaming) { this.#layOut(reply); }
    if (announcedReply === reply) { this.state.announced = corrected; }
    this.#notify();
  }

  // A tool call starting means what the agent just said this turn was a
  // bridge ("Let me have a look"), not the answer.
  #handleMCPToolCall(event) {
    if (event?.state === "loading") { this.#markBridge(); return; }
    if (event?.state !== "success") { return; }
    this.#addSources(event.result);
  }

  // Only carries the result when the agent sends full tool payloads.
  #handleAgentToolResponse(event) {
    if (event?.is_error || typeof event?.full_tool_result !== "string") { return; }
    this.#addSources(event.full_tool_result);
  }

  // Articles are not tied to the reply in flight: an answer can name one any
  // earlier tool call found, so they pool for as long as the thread lasts.
  #addSources(result) {
    const citations = agentCitationsFromToolResult(result);
    if (citations.length === 0) { return; }

    this.#sources = mergeAgentCitations(citations, this.#sources).slice(0, MAX_SOURCES);
    this.#turnSources = mergeAgentCitations(this.#turnSources, citations);
  }

  // Never the empty bubble waiting for the answer.
  #markBridge() {
    const bridge = [...this.#turnReplies()].reverse().find((reply) => reply.text);
    if (!bridge || bridge.bridge) { return; }

    bridge.bridge = true;
    if (!bridge.streaming) { this.#layOut(bridge); }
    this.#notify();
  }

  // The server ended it: the agent hung up, the connection dropped, or the
  // platform turned the session away.
  #handleDisconnected(details = undefined) {
    if (this.state.kind === "none") { return; }

    if (this.#isGreetingOverrideRejection(details)) { this.#retryWithoutGreetingOverride(); return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.#dropEmptyReply();
    this.#finalizeReply(this.#streamingReply(), { interrupted: true });
    this.#resetToIdle();

    if (wasVoice) {
      this.state.thread = [...this.state.thread, { role: "divider", text: translate("chatEnded") }];
    }

    this.#notify();
  }

  // Observed live: an agent whose security settings do not allow the
  // first-message override refuses the whole session (close code 1008,
  // "Override for field 'first_message' is not allowed by config").
  #isGreetingOverrideRejection(details) {
    return this.#greetingOverrideSent
      && details?.reason === "error"
      && /override/i.test(String(details?.message ?? ""));
  }

  // Reconnect without the override and replay what the reader asked. Their
  // pending bubble stays on screen; the new session's reply streams into it.
  // The greeting shows for this agent, exactly as before suppression existed.
  #retryWithoutGreetingOverride() {
    console.info("BeyondWords.Player: the agent's security settings do not allow the first-message override, so its greeting will show in text chats. Enable the override in ElevenLabs (Agent > Security > First message) to suppress it.");

    this.#greetingOverrideRejected = true;
    this.#greetingOverrideSent = false;

    const textOnly = this.state.kind === "text";
    const replay = this.#unanswered.splice(0);

    // The server already closed the session: invalidate its callbacks and
    // start over, keeping the thread exactly as it stands.
    this.#epoch += 1;
    this.#conversation = null;
    this.#partTurnId = null;
    this.#shadow = null;
    this.state.kind = "none";
    this.state.status = "idle";

    this.startSession({ textOnly });
    this.#queued.push(...replay);
  }

  #streamingReply(): AgentReplyMessage | null {
    const last = this.state.thread[this.state.thread.length - 1];
    return last?.role === "agent" && last.streaming ? last : null;
  }

  #replies(): AgentReplyMessage[] {
    return this.state.thread.filter((row): row is AgentReplyMessage => (
      row.role === "agent" && row.sessionEpoch === this.#epoch
    ));
  }

  // This session's replies since the reader last asked something.
  #turnReplies(): AgentReplyMessage[] {
    const thread = this.state.thread;
    let start = thread.length;
    while (start > 0 && thread[start - 1].role !== "reader") { start -= 1; }

    return thread.slice(start).filter((row): row is AgentReplyMessage => (
      row.role === "agent" && row.sessionEpoch === this.#epoch
    ));
  }

  // A reply that never received any text is a blank bubble, not an answer.
  #dropEmptyReply() {
    const pending = this.#streamingReply();
    if (!pending || pending.text) { return; }

    this.state.thread = this.state.thread.slice(0, -1);
  }

  #finalizeReply(reply: AgentReplyMessage | null, { interrupted = false }: { interrupted?: boolean } = {}): void {
    if (!reply) { return; }

    // Re-finalizing a reply that already stopped streaming (its whole message
    // arriving late) leaves whichever stream is live alone.
    const wasStreaming = reply.streaming;
    reply.streaming = false;
    reply.typing = false;
    reply.interrupted = interrupted;
    this.#layOut(reply);
    if (!interrupted || reply.text) { this.state.announced = reply.text; }
    if (reply.text) { this.#unanswered = []; }
    if (wasStreaming) { this.#partTurnId = null; }
  }

  // Bridges and cut-off replies cite nothing. An answer cites, beside the
  // sentence that names it, any article the tools returned this session.
  #layOut(reply: AgentReplyMessage) {
    if (reply.interrupted || reply.bridge) {
      reply.layout = layoutAgentReply(reply.text);
      reply.citations = [];
      return;
    }

    reply.layout = layoutAgentReply(reply.text, { sources: this.#sources, fallback: this.#fallbackFor(reply) });
    reply.citations = [...reply.layout.segments.flatMap(({ citations }) => citations), ...reply.layout.trailing];
  }

  // The one article a turn's tools returned, for an answer that sums it up
  // without naming it. Kept per reply, so a late correction still has it.
  #fallbackFor(reply: AgentReplyMessage): AgentCitation | null {
    if (this.#turnReplies().includes(reply)) {
      this.#fallbacks.set(reply, this.#turnSources.length === 1 ? this.#turnSources[0] : null);
    }

    return this.#fallbacks.get(reply) ?? null;
  }

  #resetToIdle() {
    this.#epoch += 1;
    this.#queued = [];
    this.#unanswered = [];
    this.#greetingOverrideSent = false;
    this.#partTurnId = null;
    this.#shadow = null;
    this.#resentResponseIds.clear();
    this.#interruptedTurnIds.clear();
    this.#ignoreNextAgentTurn = false;
    this.#ignoreNextUncorrelatedWholeMessage = false;
    this.#turnSources = [];
    this.#disarmSilenceTimer();

    const ending = this.#conversation?.endSession?.();
    if (ending instanceof Promise) { ending.catch(() => {}); }
    this.#conversation = null;

    this.state.kind = "none";
    this.state.status = "idle";
    this.state.muted = false;
  }

  #flushQueued() {
    const queued = this.#queued;
    this.#queued = [];
    queued.forEach((text) => this.#conversation.sendUserMessage(text));
  }

  #conversationRows() {
    return this.state.thread.filter((row: { role?: string }) => row.role !== "divider").length;
  }

  // Voice minutes only count while a call is live, so an idle call hangs up
  // by itself. Anything the reader does re-arms it.
  #armSilenceTimer() {
    this.#disarmSilenceTimer();
    if (this.state.kind !== "voice" || this.state.status !== "listening") { return; }

    const epoch = this.#epoch;
    this.silenceTimer = setTimeout(() => {
      if (epoch !== this.#epoch) { return; }
      this.endSession("silence");
    }, this.silenceTimeoutMs);
  }

  #disarmSilenceTimer() {
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); }
    this.silenceTimer = null;
  }

  #notify() {
    // A fresh object so Svelte's store contract sees a change.
    this.state = { ...this.state };
    this.store.set(this.state);
  }
}

// The behaviour suite stubs the SDK from the page; everything else loads the
// real one (node_modules in development, dist/elevenlabs-client.js in builds -
// see bin/vendor_agent).
const defaultLoadSdk = async (): Promise<ElevenLabsAgentSdk> => {
  const stub = typeof window !== "undefined" && (window as { __elevenLabsClientStub?: unknown }).__elevenLabsClientStub;
  if (stub) { return stub as ElevenLabsAgentSdk; }

  return await import("./elevenLabsSdk.ts") as ElevenLabsAgentSdk;
};

export default RealAgentClient;
