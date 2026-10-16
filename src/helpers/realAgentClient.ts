import translate from "./translate";
import { writable } from "svelte/store";
import type { Subscriber, Writable } from "svelte/store";
import type AuthApiClient from "../api_clients/authApiClient";
import type { AgentSession, AgentSessionMode } from "../api_clients/authApiClient";
import getUserSession from "./getUserSession";
import type {
  AgentCitation,
  AgentClient,
  AgentDelivery,
  AgentEndReason,
  AgentErrorCode,
  AgentMessage,
  AgentOpResult,
  AgentReplyMessage,
  AgentSessionConfig,
  AgentSessionOptions,
  AgentState,
} from "./agentContracts";
import {
  agentCitationsFromToolResult,
  citationsForAgentText,
  mergeAgentCitations,
} from "./agentLinks";
import { HttpError } from "./fetchJson";

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
// When the player has an auth provider, the reader's session token goes with
// that request, the same way setPropsFromApi sends it to verify, so the auth
// service can tie the agent session to the reader's access tier.
//
// SDK -> thread mapping notes:
// - Text replies stream through onAgentChatResponsePart (start/delta/stop,
//   correlated by event_id). Voice replies usually land whole through
//   onMessage; alignment-paced reveal for spoken replies is a later phase.
// - There is no client-side interrupt in the SDK: in a call the reader speaks
//   over the agent (server VAD). canInterrupt tells the panel not to offer a
//   tap-to-interrupt, and interrupt() only stops the local text reveal.

const SILENCE_TIMEOUT_MS = 30_000;

// Tags a start-session leg whose outcome is not yet known, so a fail-fast
// rejection can still be classified against the sibling that failed in the
// same tick.
const UNSETTLED = Symbol("unsettled");

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
  authProvider?: string;
  sessionConfig?: AgentSessionConfig;
  dynamicVariables?: () => Record<string, unknown>;
  loadSdk?: () => Promise<ElevenLabsAgentSdk>;
  silenceTimeoutMs?: number;
}

class RealAgentClient implements AgentClient {
  agentId: string | undefined;
  authClient: AuthApiClient | undefined;
  authProvider: string | undefined;
  agentSessionConfig: AgentSessionConfig;
  sessionConfigKey: string;
  dynamicVariables: (() => Record<string, unknown>) | undefined;
  loadSdk: () => Promise<ElevenLabsAgentSdk>;
  silenceTimeoutMs: number;
  canInterrupt = false;

  state: AgentState;

  store: Writable<AgentState>;
  silenceTimer: ReturnType<typeof setTimeout> | null;

  // Facade hook: queued (undelivered) messages were flushed or discarded.
  onQueueSettled: ((outcome: "delivered" | "dropped", count: number) => void) | null = null;

  #conversation: AgentConversation | null = null;
  #lastFailedAttempt: { textOnly: boolean } | null = null;
  #awaitingDisconnectDetails = false;
  #queued: string[] = [];
  #epoch = 0;
  #partTurnId: number | null = null;
  #interruptedTurnIds = new Set<number>();
  #ignoreNextAgentTurn = false;
  #ignoreNextUncorrelatedWholeMessage = false;
  #unanswered: string[] = [];
  #pendingCitations: AgentCitation[] = [];
  #greetingOverrideSent = false;
  #greetingOverrideRejected = false;

  constructor({ agentId, authClient, authProvider, sessionConfig, dynamicVariables, loadSdk, silenceTimeoutMs }: RealAgentClientOptions = {}) {
    this.agentId = agentId;
    this.authClient = authClient;
    this.authProvider = authProvider;
    this.agentSessionConfig = sessionConfig || {};
    this.sessionConfigKey = JSON.stringify(this.agentSessionConfig);
    this.dynamicVariables = dynamicVariables;
    this.loadSdk = loadSdk ?? defaultLoadSdk;

    this.silenceTimeoutMs = silenceTimeoutMs
      ?? (typeof window !== "undefined" && (window as { __agentSilenceTimeoutMs?: number }).__agentSilenceTimeoutMs)
      ?? SILENCE_TIMEOUT_MS;

    this.state = { kind: "none", status: "idle", muted: false, thread: [], announced: "", error: null, lastEnd: null };
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

    // Published with the optimistic state: subscribers see the error drop the
    // moment a retry starts, and a repeat failure with the same code reads as
    // a change again (null -> code).
    this.state.error = null;

    this.#notify();

    // Each leg records its own outcome so a fail-fast rejection can still be
    // classified against the sibling that failed in the same tick.
    let sdkFailure: unknown = UNSETTLED;
    let sessionFailure: unknown = UNSETTLED;
    const sdkPromise = this.loadSdk().then(
      (sdk) => { sdkFailure = null; return sdk; },
      (error) => { sdkFailure = error ?? new Error("sdk load failed"); throw error; });
    const sessionPromise = this.#agentSession(kind).then(
      (session) => { sessionFailure = null; return session; },
      (error) => { sessionFailure = error ?? new Error("agent session failed"); throw error; });

    // The leg that loses the race must not surface as an unhandled rejection.
    sdkPromise.catch(() => {});
    sessionPromise.catch(() => {});

    let Conversation: ElevenLabsAgentSdk["Conversation"];
    let session: AgentSession;
    try {
      [{ Conversation }, session] = await Promise.all([sdkPromise, sessionPromise]);
    } catch (raceError) {
      if (epoch !== this.#epoch) { return; }
      // One microtask of grace: a sibling that failed in the same tick is now
      // tagged, so the original classification priority applies to it too.
      await Promise.resolve();
      if (epoch !== this.#epoch) { return; }

      const sessionKnown = sessionFailure !== UNSETTLED && sessionFailure !== null;
      const sdkKnown = sdkFailure !== UNSETTLED && sdkFailure !== null;

      // A definite server answer outranks a load failure (both usually fail
      // together offline, and then neither has a numeric status).
      if (sessionKnown && sessionFailure instanceof HttpError && typeof sessionFailure.status === "number") {
        this.#failStart(textOnly, this.#sessionErrorCode(sessionFailure), sessionFailure);
        return;
      }
      if (sdkKnown) {
        this.#failStart(textOnly, "sdk_load_failed", sdkFailure);
        return;
      }
      this.#failStart(textOnly, this.#sessionErrorCode(sessionKnown ? sessionFailure : raceError),
        sessionKnown ? sessionFailure : raceError);
      return;
    }
    if (epoch !== this.#epoch) { return; }

    let conversation: AgentConversation;
    try {
      conversation = await Conversation.startSession(this.#sessionConfig(epoch, textOnly, session));
    } catch (error) {
      // A voice connect failure fires a details-less "disconnected" status
      // first; #handleStatusChange ignores it while connecting, so the epoch
      // is still intact here and the failure gets classified.
      if (epoch !== this.#epoch) { return; }
      this.#failStart(textOnly, this.#connectErrorCode(textOnly, error), error);
      return;
    }

    // Ended or cancelled while connecting: the session opened, so close it.
    if (epoch !== this.#epoch) {
      const ending = conversation.endSession?.();
      if (ending instanceof Promise) { ending.catch(() => {}); }
      return;
    }

    this.#conversation = conversation;
    this.#lastFailedAttempt = null;
    this.#flushQueued();
  }

  // The reader's credentials are read fresh for every session: the session
  // token can change between sessions (sign in, sign out) and the credential
  // the auth service hands back is single-use anyway.
  async #agentSession(mode: AgentSessionMode): Promise<AgentSession> {
    if (!this.authClient)
      throw new Error("no auth client to start an agent session with");

    const userSession = this.authProvider ? await getUserSession(this.authProvider) : null;
    return this.authClient.agentSession({
      mode,
      integrationType: userSession?.authProvider,
      sessionToken: userSession?.sessionToken,
    });
  }

  #failStart(textOnly: boolean, code: AgentErrorCode, error: unknown): void {
    console.warn(`BeyondWords.Player agent session failed: ${error}`);

    this.#lastFailedAttempt = { textOnly };
    this.#resetToIdle();
    this.state.lastEnd = "failed";
    this.state.error = {
      code,
      mode: textOnly ? "text" : "voice",
      message: error instanceof Error ? error.message : String(error ?? ""),
    };

    // A failed connect never started, so like Cancel it leaves no mark; a
    // reply bubble that never got any text goes with it.
    this.#dropEmptyReply();
    this.#notify();
  }

  // The auth service answered: classify by its HTTP status.
  #sessionErrorCode(error: unknown): AgentErrorCode {
    if (!(error instanceof HttpError)) { return "network"; }
    if (error.status === 404) { return "not_configured"; }
    if (error.status === 503) { return "agent_unavailable"; }
    if (error.status === 400) { return "invalid_request"; }
    if (error.status === undefined) { return "network"; } // fetch TypeError path
    return error.status >= 500 ? "agent_unavailable" : "invalid_request"; // unmapped statuses
  }

  // The SDK's connect failed; the mic only exists for voice sessions.
  #connectErrorCode(textOnly: boolean, error: unknown): AgentErrorCode {
    const name = (error as { name?: string } | null)?.name;
    if (!textOnly && name === "NotAllowedError") { return "mic_denied"; }
    if (!textOnly && name === "NotFoundError") { return "mic_unavailable"; }
    return "connection_failed";
  }

  // Typed asks work inside a voice call - same conversation, replies stay
  // spoken. Sending over a reply starts a new turn; the server interrupts the
  // agent for us, we just close the on-screen reveal.
  sendUserMessage(text: string): AgentDelivery {
    if (!this.agentId) {
      console.warn("BeyondWords.Player cannot send an agent message without an agentId.");
      return "dropped";
    }

    if (this.state.kind === "none") { this.startSession({ textOnly: true }); }

    // A reply that has text stays, cut short; one that never got any goes -
    // the platform will answer the newest question in the fresh bubble.
    this.#dropEmptyReply();
    const pending = this.#streamingReply();
    if (pending) { this.#finalizeReply(pending, { interrupted: true }); }

    const reply: AgentReplyMessage = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice", sessionEpoch: this.#epoch };
    this.state.thread = [...this.state.thread, { role: "reader", text }, reply];
    this.#disarmSilenceTimer();
    this.#notify();

    // Kept until a reply lands, so a rejected session start can replay them.
    this.#unanswered.push(text);

    if (this.#conversation) {
      this.#conversation.sendUserMessage(text);
      return "sent";
    }

    this.#queued.push(text);
    return "queued";
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
    this.state.lastEnd = reason;

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
    this.state.lastEnd = "cancelled";
    this.#notify();
  }

  // Re-attempt the last failed startSession. This is the low-level hook: the
  // public path is the facade's retry(), which re-gates policy first.
  retry(): AgentOpResult {
    if (!this.state.error || !this.#lastFailedAttempt) { return { ok: false, reason: "nothing_to_retry" }; }

    const { textOnly } = this.#lastFailedAttempt;
    // Entry clears state.error (published before the optimistic notify).
    this.startSession({ textOnly });
    return { ok: true };
  }

  clearError(): AgentOpResult {
    if (this.state.error) {
      this.state.error = null;
      this.#notify();
    }
    return { ok: true };
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
      onMessage: guarded(({ message, role, source, event_id: eventId }) => this.#handleMessage(message, role || source, eventId)),
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

    if (status === "disconnected") {
      // A voice CONNECT failure fires this status synchronously inside the
      // SDK's catch and then rethrows (VoiceConversation setupStrategy). The
      // startSession rejection catch owns that classification, so a
      // details-less disconnect while we are still connecting is ignored here
      // - otherwise its handling (sync before this fix, deferred below) would
      // reset the epoch first and the catch would be silently skipped:
      // mic_denied/mic_unavailable/connection_failed, retry and AgentErrored
      // would all be dead for voice.
      if (this.state.status === "connecting") { return; }

      // Mid-call: the SDK fires this status synchronously BEFORE
      // onDisconnect(details) in the same frame (BaseConversation's
      // endSessionWithDetails), so one microtask is enough for the details to
      // win; the fallback covers stubs that only emit a status.
      const epoch = this.#epoch; // not yet reset at this point
      this.#awaitingDisconnectDetails = true;
      queueMicrotask(() => {
        if (!this.#awaitingDisconnectDetails || epoch !== this.#epoch) { return; }
        this.#handleDisconnected();
      });
    }
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
  #handleMessage(message, role, eventId) {
    if (role === "user") {
      // A just-typed message echoed back is not a second row.
      const recent = this.state.thread.slice(-2) as { role?: string; text?: string }[];
      if (recent.some((row) => row.role === "reader" && row.text === message)) { return; }

      this.state.thread = [...this.state.thread, { role: "reader", text: message }];
      this.#pendingCitations = [];
      this.#notify();
      this.#armSilenceTimer();
      return;
    }

    // The platform sends an empty agent_response while its tools run; there
    // is nothing to render, and the pending bubble stays open for the answer.
    if (!message || !message.trim()) { return; }

    // A whole agent_response follows the streamed parts for the same turn.
    // Correlate it to that turn rather than suppressing all whole messages for
    // the rest of the session: later turns (and later sessions) may use the
    // whole-message fallback instead.
    const replies = this.state.thread.filter((row): row is AgentReplyMessage => (
      row.role === "agent" && row.sessionEpoch === this.#epoch
    ));

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

    const matchingPartsReply = eventId === undefined || eventId === null
      ? null
      : [...replies].reverse().find((reply) => reply.fromParts && reply.eventId === eventId);

    if (matchingPartsReply?.interrupted) { return; }

    if (matchingPartsReply?.text) {
      const changed = matchingPartsReply.text !== message || matchingPartsReply.streaming;
      this.#finalizeReply(this.#patchRow(matchingPartsReply, { text: message }));
      if (changed) { this.#notify(); }
      return;
    }

    // Older SDK events can omit event_id. Exact text on the most recent
    // parts-built reply is still enough to identify the duplicate safely.
    const lastReply = replies[replies.length - 1];
    if ((eventId === undefined || eventId === null) && lastReply?.fromParts && lastReply.text === message) {
      const changed = lastReply.streaming;
      this.#finalizeReply(lastReply);
      if (changed) { this.#notify(); }
      return;
    }

    const pending = this.#streamingReply();

    if (pending && pending.text === "") {
      this.#finalizeReply(this.#patchRow(pending, { typing: false, text: message, eventId }));
    } else if (!pending) {
      const citationCandidates = this.#takePendingCitations();
      const reply: AgentReplyMessage = {
        role: "agent",
        text: message,
        citations: citationsForAgentText(message, citationCandidates || []),
        streaming: false,
        typing: false,
        spoken: this.state.kind === "voice",
        eventId,
        sessionEpoch: this.#epoch,
        ...(citationCandidates ? { citationCandidates } : {}),
      };
      this.state.thread = [...this.state.thread, reply];
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
  #handleResponsePart({ text, type, event_id: eventId }) {
    if (type === "start") {
      this.#partTurnId = eventId ?? -1;

      if (this.#ignoreNextAgentTurn) {
        this.#ignoreNextAgentTurn = false;
        if (eventId !== undefined && eventId !== null) { this.#interruptedTurnIds.add(eventId); }
        this.#ignoreNextUncorrelatedWholeMessage = true;
        return;
      }

      if (eventId !== undefined && eventId !== null && this.#interruptedTurnIds.has(eventId)) { return; }

      if (!this.#streamingReply()) {
        const reply: AgentReplyMessage = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice", sessionEpoch: this.#epoch };
        this.state.thread = [...this.state.thread, reply];
        this.#notify();
      }

      const pending = this.#streamingReply();
      const citationCandidates = this.#takePendingCitations(pending.citationCandidates);
      this.#patchRow(pending, {
        eventId,
        fromParts: true,
        sessionEpoch: this.#epoch,
        ...(citationCandidates ? { citationCandidates } : {}),
      });

      return;
    }

    if (eventId !== undefined && eventId !== null && this.#interruptedTurnIds.has(eventId)) {
      if (type === "stop") { this.#partTurnId = null; }
      return;
    }

    if ((eventId ?? -1) !== this.#partTurnId) { return; }

    const pending = this.#streamingReply();
    if (!pending) { this.#partTurnId = null; return; }

    if (type === "delta") {
      this.#patchRow(pending, { typing: false, text: pending.text + (text ?? "") });
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

  // The agent withdrew part of an answer (usually after an interruption);
  // what is on screen follows suit.
  #handleCorrection({ corrected_agent_response: corrected, original_agent_response: original, event_id: eventId }) {
    if (typeof corrected !== "string") { return; }

    const replies = this.state.thread.filter((row): row is AgentReplyMessage => (
      row.role === "agent" && row.sessionEpoch === this.#epoch
    ));
    const reply = (eventId === undefined || eventId === null
      ? null
      : [...replies].reverse().find((row) => row.eventId === eventId))
      ?? (typeof original === "string" ? [...replies].reverse().find((row) => row.text === original) : null);

    // A delayed correction must never land in a newer turn's pending bubble.
    if (!reply || reply.interrupted) { return; }

    const announcedReply = [...replies].reverse().find((row) => !row.streaming && row.text === this.state.announced);
    this.#patchRow(reply, {
      text: corrected,
      citations: citationsForAgentText(corrected, reply.citationCandidates || []),
    });
    if (announcedReply === reply) { this.state.announced = corrected; }
    this.#notify();
  }

  #handleMCPToolCall(event) {
    if (event?.state !== "success") { return; }
    this.#handleToolCitations(event.result);
  }

  #handleAgentToolResponse(event) {
    if (event?.is_error || typeof event?.full_tool_result !== "string") { return; }
    this.#handleToolCitations(event.full_tool_result, event.event_id);
  }

  #handleToolCitations(result, eventId = undefined) {
    const citations = agentCitationsFromToolResult(result);
    if (citations.length === 0) { return; }

    const replies = this.state.thread.filter((row): row is AgentReplyMessage => (
      row.role === "agent" && row.sessionEpoch === this.#epoch
    ));
    const matching = eventId === undefined || eventId === null
      ? null
      : [...replies].reverse().find((reply) => reply.eventId === eventId);
    const reply = matching || this.#streamingReply();

    if (!reply) {
      this.#pendingCitations = mergeAgentCitations(this.#pendingCitations, citations);
      return;
    }

    const citationCandidates = mergeAgentCitations(reply.citationCandidates || [], citations);
    this.#patchRow(reply, {
      citationCandidates,
      ...(!reply.streaming ? { citations: citationsForAgentText(reply.text, citationCandidates) } : {}),
    });
    this.#notify();
  }

  // The server ended it: the agent hung up, the connection dropped, or the
  // platform turned the session away.
  #handleDisconnected(details: { reason?: string; message?: unknown } | undefined = undefined) {
    this.#awaitingDisconnectDetails = false;

    if (this.state.kind === "none") { return; }

    if (this.#isGreetingOverrideRejection(details)) { this.#retryWithoutGreetingOverride(); return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.#dropEmptyReply();
    this.#finalizeReply(this.#streamingReply(), { interrupted: true });
    this.#resetToIdle();

    this.state.lastEnd = "disconnected";
    if (details?.reason === "error") {
      // No mode: a dropped session is not retriable through retry().
      this.state.error = { code: "disconnected", message: String(details?.message ?? "") };
    }

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
    this.state.kind = "none";
    this.state.status = "idle";

    this.startSession({ textOnly });
    this.#queued.push(...replay);
  }

  #streamingReply(): AgentReplyMessage | null {
    const last = this.state.thread[this.state.thread.length - 1];
    return last?.role === "agent" && last.streaming ? last : null;
  }

  // Copy-on-write: every row mutation replaces the row object AND the thread
  // array, so subscribers comparing by reference (React selectors, the facade
  // row cache) see every change. Callers must use the returned row afterwards
  // and re-fetch #streamingReply() after a patch.
  #patchRow<T extends AgentMessage>(row: T, patch: Partial<T>): T {
    const index = this.state.thread.indexOf(row);
    if (index === -1) { return row; } // stale reference: ignore

    const next = { ...row, ...patch } as T;
    const thread = this.state.thread.slice();
    thread[index] = next;
    this.state.thread = thread;
    return next;
  }

  // Citations gathered before their reply existed, merged in once it does.
  #takePendingCitations(existing?: AgentCitation[]): AgentCitation[] | undefined {
    if (this.#pendingCitations.length === 0) { return existing; }

    const merged = mergeAgentCitations(existing || [], this.#pendingCitations);
    this.#pendingCitations = [];
    return merged;
  }

  // A reply that never received any text is a blank bubble, not an answer.
  #dropEmptyReply() {
    const pending = this.#streamingReply();
    if (!pending || pending.text) { return; }

    this.state.thread = this.state.thread.slice(0, -1);
  }

  #finalizeReply(reply: AgentReplyMessage | null, { interrupted = false }: { interrupted?: boolean } = {}): AgentReplyMessage | null {
    if (!reply) { return null; }

    const citationCandidates = this.#takePendingCitations(reply.citationCandidates);
    const next = this.#patchRow(reply, {
      streaming: false,
      typing: false,
      interrupted,
      citations: interrupted ? [] : citationsForAgentText(reply.text, citationCandidates || []),
      ...(citationCandidates ? { citationCandidates } : {}),
    });
    if (!interrupted || next.text) { this.state.announced = next.text; }
    if (next.text) { this.#unanswered = []; }
    this.#partTurnId = null;
    return next;
  }

  #resetToIdle() {
    // Messages still queued never reached the server; the facade refunds them.
    const dropped = this.#queued.length;

    this.#epoch += 1;
    this.#queued = [];
    this.#unanswered = [];
    this.#greetingOverrideSent = false;
    this.#partTurnId = null;
    this.#interruptedTurnIds.clear();
    this.#ignoreNextAgentTurn = false;
    this.#ignoreNextUncorrelatedWholeMessage = false;
    this.#pendingCitations = [];
    this.#awaitingDisconnectDetails = false;
    this.#disarmSilenceTimer();

    const ending = this.#conversation?.endSession?.();
    if (ending instanceof Promise) { ending.catch(() => {}); }
    this.#conversation = null;

    this.state.kind = "none";
    this.state.status = "idle";
    this.state.muted = false;

    if (dropped > 0) { this.onQueueSettled?.("dropped", dropped); }
  }

  #flushQueued() {
    const queued = this.#queued;
    this.#queued = [];
    queued.forEach((text) => this.#conversation.sendUserMessage(text));
    if (queued.length > 0) { this.onQueueSettled?.("delivered", queued.length); }
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
