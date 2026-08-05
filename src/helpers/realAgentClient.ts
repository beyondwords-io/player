// The live agent client: the same store shape and methods as MockAgentClient
// (see that file for the session model), backed by the ElevenLabs Agents SDK.
// The player selects this client when the project serves an agent id
// (conversational_agent.elevenlabs_agent_id in /player, or the agentId prop).
//
// The SDK itself stays out of the base bundle: it is loaded on the first
// startSession, and the behaviour suite can swap it for a stub through
// window.__elevenLabsClientStub.
//
// Phase 1 talks to a public agent (startSession({ agentId })). Auth must
// follow before this is generally available: a public id lets anyone start
// conversations on the publisher's account, so a token endpoint replaces it
// and becomes the enforcement point for per-tier access.
//
// SDK -> thread mapping notes:
// - Text replies stream through onAgentChatResponsePart (start/delta/stop,
//   correlated by event_id). Voice replies usually land whole through
//   onMessage; alignment-paced reveal for spoken replies is a later phase.
// - There is no client-side interrupt in the SDK: in a call the reader speaks
//   over the agent (server VAD). canInterrupt tells the panel not to offer a
//   tap-to-interrupt, and interrupt() only stops the local text reveal.

const SILENCE_TIMEOUT_MS = 30_000;

class RealAgentClient {
  agentId: string;
  dynamicVariables: (() => Record<string, unknown>) | undefined;
  loadSdk: () => Promise<{ Conversation: { startSession: (options: unknown) => Promise<unknown> } }>;
  silenceTimeoutMs: number;
  canInterrupt = false;

  state: {
    kind: "none" | "text" | "voice";
    status: "idle" | "connecting" | "listening" | "talking";
    muted: boolean;
    thread: unknown[];
    announced: string;
  };

  subscribers: Set<(state: unknown) => void>;
  silenceTimer: ReturnType<typeof setTimeout> | null;

  #conversation = null;
  #queued: string[] = [];
  #epoch = 0;
  #partTurnId: number | null = null;
  #sawParts = false;

  constructor({ agentId, dynamicVariables, loadSdk, silenceTimeoutMs } = {}) {
    this.agentId = agentId;
    this.dynamicVariables = dynamicVariables;
    this.loadSdk = loadSdk ?? defaultLoadSdk;

    this.silenceTimeoutMs = silenceTimeoutMs
      ?? (typeof window !== "undefined" && (window as { __agentSilenceTimeoutMs?: number }).__agentSilenceTimeoutMs)
      ?? SILENCE_TIMEOUT_MS;

    this.state = { kind: "none", status: "idle", muted: false, thread: [], announced: "" };
    this.subscribers = new Set();
    this.silenceTimer = null;
  }

  subscribe(run) {
    this.subscribers.add(run);
    run(this.state);

    return () => this.subscribers.delete(run);
  }

  // A session starts on the first user act, never on opening the panel.
  // Switching kinds ends the live conversation first: text and voice are
  // separate conversations on the platform too, so nothing carries over.
  async startSession({ textOnly = false } = {}) {
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
      const { Conversation } = await this.loadSdk();
      if (epoch !== this.#epoch) { return; }

      const conversation = await Conversation.startSession(this.#sessionConfig(epoch, textOnly));

      // Ended or cancelled while connecting: the session opened, so close it.
      if (epoch !== this.#epoch) { (conversation as { endSession: () => Promise<void> })?.endSession?.()?.catch?.(() => {}); return; }

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
  sendUserMessage(text) {
    if (this.state.kind === "none") { this.startSession({ textOnly: true }); }

    // A reply that has text stays, cut short; one that never got any goes -
    // the platform will answer the newest question in the fresh bubble.
    this.#dropEmptyReply();
    const pending = this.#streamingReply();
    if (pending) { this.#finalizeReply(pending, { interrupted: true }); }

    const reply = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice" };
    this.state.thread = [...this.state.thread, { role: "reader", text }, reply];
    this.#disarmSilenceTimer();
    this.#notify();

    if (this.#conversation) {
      this.#conversation.sendUserMessage(text);
    } else {
      this.#queued.push(text);
    }
  }

  // Keystrokes: the agent holds instead of talking over you.
  sendUserActivity() {
    this.#conversation?.sendUserActivity?.();
    if (this.state.kind === "voice") { this.#armSilenceTimer(); }
  }

  setMicMuted(muted) {
    if (this.state.kind !== "voice") { return; }

    this.#conversation?.setMicMuted?.(muted);
    this.state.muted = muted;
    this.#notify();
    this.#armSilenceTimer();
  }

  // The SDK has no client-side interrupt - speaking over the agent is the
  // interrupt - so this only stops the local reveal of a text reply.
  interrupt() {
    const pending = this.#streamingReply();
    if (!pending) { return; }

    this.#finalizeReply(pending, { interrupted: true });
    this.#notify();
  }

  // The End pill, the widget's x, teardown, or the silence timeout. Ending
  // keeps the thread; a voice call marks where it stopped.
  endSession(reason = "ended") {
    if (this.state.kind === "none") { return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.#finalizeReply(this.#streamingReply(), { interrupted: true });
    this.#resetToIdle();

    if (wasVoice && reason !== "switched") {
      this.state.thread = [...this.state.thread, { role: "divider", text: "Chat ended" }];
    }

    this.#notify();
  }

  // Cancel during "Connecting…": nothing started, nothing to mark. If the
  // session resolves after this, startSession sees the stale epoch and
  // closes it.
  cancelConnect() {
    if (this.state.status !== "connecting") { return; }

    this.#resetToIdle();
    this.#notify();
  }

  // A locked agent takes the question without a session and answers with the
  // publisher's offer; the panel supplies no copy of its own.
  appendLocked(text) {
    this.state.thread = [...this.state.thread, { role: "reader", text }, { role: "locked" }];
    this.#notify();
  }

  // private

  #sessionConfig(epoch, textOnly) {
    const guarded = (handler) => (payload) => {
      if (epoch !== this.#epoch) { return; }
      handler(payload);
    };

    return {
      agentId: this.agentId,
      ...(textOnly ? { textOnly: true } : {}),
      ...this.#dynamicVariablesConfig(),
      onStatusChange: guarded(({ status }) => this.#handleStatusChange(status)),
      onModeChange: guarded(({ mode }) => this.#handleModeChange(mode)),
      onMessage: guarded(({ message, role, source }) => this.#handleMessage(message, role || source)),
      onAgentChatResponsePart: guarded((part) => this.#handleResponsePart(part)),
      onAgentResponseCorrection: guarded((event) => this.#handleCorrection(event)),
      onDisconnect: guarded(() => this.#handleDisconnected()),
      onError: (message, context) => console.warn(`BeyondWords.Player agent error: ${message}`, context),
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
        this.state.thread = [...this.state.thread, { role: "divider", text: "New voice chat — nothing carries over" }];
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
  #handleMessage(message, role) {
    if (role === "user") {
      // A just-typed message echoed back is not a second row.
      const recent = this.state.thread.slice(-2) as { role?: string; text?: string }[];
      if (recent.some((row) => row.role === "reader" && row.text === message)) { return; }

      this.state.thread = [...this.state.thread, { role: "reader", text: message }];
      this.#notify();
      this.#armSilenceTimer();
      return;
    }

    // The platform sends an empty agent_response while its tools run; there
    // is nothing to render, and the pending bubble stays open for the answer.
    if (!message || !message.trim()) { return; }

    // Streams already put this text on screen delta by delta.
    if (this.#sawParts && this.state.kind === "text") { return; }

    const pending = this.#streamingReply();

    if (pending && pending.text === "") {
      pending.typing = false;
      pending.text = message;
      this.#finalizeReply(pending);
    } else if (!pending) {
      const reply = { role: "agent", text: message, citations: [], streaming: false, typing: false, spoken: this.state.kind === "voice" };
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
      this.#sawParts = true;
      this.#partTurnId = eventId ?? -1;

      if (!this.#streamingReply()) {
        const reply = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken: this.state.kind === "voice" };
        this.state.thread = [...this.state.thread, reply];
        this.#notify();
      }

      return;
    }

    if ((eventId ?? -1) !== this.#partTurnId) { return; }

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

  // The agent withdrew part of an answer (usually after an interruption);
  // what is on screen follows suit.
  #handleCorrection({ corrected_agent_response: corrected }) {
    const lastReply = [...this.state.thread].reverse().find((row: { role?: string }) => row.role === "agent");
    if (!lastReply || typeof corrected !== "string") { return; }

    (lastReply as { text: string }).text = corrected;
    if (this.state.announced) { this.state.announced = corrected; }
    this.#notify();
  }

  // The server ended it: the agent hung up, the connection dropped, or the
  // platform turned the session away.
  #handleDisconnected() {
    if (this.state.kind === "none") { return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.#dropEmptyReply();
    this.#finalizeReply(this.#streamingReply(), { interrupted: true });
    this.#resetToIdle();

    if (wasVoice) {
      this.state.thread = [...this.state.thread, { role: "divider", text: "Chat ended" }];
    }

    this.#notify();
  }

  #streamingReply() {
    const last = this.state.thread[this.state.thread.length - 1];
    return last && (last as { role?: string }).role === "agent" && (last as { streaming?: boolean }).streaming ? last : null;
  }

  // A reply that never received any text is a blank bubble, not an answer.
  #dropEmptyReply() {
    const pending = this.#streamingReply();
    if (!pending || (pending as { text?: string }).text) { return; }

    this.state.thread = this.state.thread.slice(0, -1);
  }

  #finalizeReply(reply, { interrupted = false } = {}) {
    if (!reply) { return; }

    reply.streaming = false;
    reply.typing = false;
    if (!interrupted || reply.text) { this.state.announced = reply.text; }
    this.#partTurnId = null;
  }

  #resetToIdle() {
    this.#epoch += 1;
    this.#queued = [];
    this.#partTurnId = null;
    this.#disarmSilenceTimer();

    this.#conversation?.endSession?.()?.catch?.(() => {});
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
    this.subscribers.forEach((run) => run(this.state));
  }
}

// The behaviour suite stubs the SDK from the page; everything else loads the
// real one (node_modules in development, dist/elevenlabs-client.js in builds -
// see bin/vendor_agent).
const defaultLoadSdk = async () => {
  const stub = typeof window !== "undefined" && (window as { __elevenLabsClientStub?: unknown }).__elevenLabsClientStub;
  if (stub) { return stub; }

  return await import("./elevenLabsSdk.ts");
};

export default RealAgentClient;
