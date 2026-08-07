import translate from "./translate";

// Agent client for the default player's Chat/Talk surfaces.
//
// The real backend integration does not exist yet, so the player ships with a
// deterministic mock - but the mock has the ElevenLabs Agents SDK's shape, so
// wiring the real agent stays contained in this file:
//
//   startSession({ textOnly })  <-  Conversation.startSession
//   sendUserMessage(text)       <-  sendUserMessage (typed asks, incl. mid-call)
//   sendUserActivity()          <-  sendUserActivity (keystrokes hold the agent)
//   setMicMuted(muted)          <-  setMicMuted
//   endSession(reason)          <-  endSession
//
// A conversation is a session: a costed, connected thing. Text and voice are
// separate conversations - there is no in-place upgrade between session types,
// so switching ends one and starts the other, and the thread marks the break.
//
// The client is also the store: it owns the thread and the call state, so the
// panel can unmount (collapse) without hanging up or losing anything. Svelte
// auto-subscription works on it directly ($agentClient).
//
// When this is wired for real, replies should reveal their text from
// onAgentChatResponsePart deltas as the mock does, spoken replies should pace
// the reveal from onAudioAlignment's per-character timings instead of an
// invented typing speed, and onAgentResponseCorrection may replace text that
// is already on screen.

const SCRIPTED_ANSWERS = [
  {
    text: "This article covers the launch of a new audio platform, " +
      "which converts written journalism into listenable formats. " +
      "The publisher reports early engagement well above their expectations.",
    citations: [{ title: "From the article", url: "#segment-3" }],
  },
  {
    text: "The main points are the partnership announcement, " +
      "the rollout timeline for later this year, " +
      "and the early results from the pilot programme.",
    citations: [
      { title: "Partnership details", url: "#segment-5" },
      { title: "Pilot results", url: "#segment-9" },
    ],
  },
  {
    text: "Yes - the publication has covered this topic before. " +
      "The most recent related piece looked at how newsrooms adopt audio, " +
      "and there is a longer background explainer from earlier this year.",
    citations: [{ title: "Related coverage", url: "#related" }],
  },
];

const MOCK_UTTERANCE = "What changed since last week's story?";

const CONNECT_MS = 700;
const FIRST_UTTERANCE_MS = 2400;
const SILENCE_TIMEOUT_MS = 30_000;

class MockAgentClient {
  answerIndex: number;
  silenceTimeoutMs: number;

  // The mock can stop a reply on demand; the real SDK cannot (speaking over
  // the agent is the interrupt), so the panel checks before offering a tap.
  canInterrupt = true;

  // kind: what conversation is live. status: the voice call's state - text
  // sessions show no connection state at all, so theirs stays "idle".
  state: {
    kind: "none" | "text" | "voice";
    status: "idle" | "connecting" | "listening" | "talking";
    muted: boolean;
    thread: unknown[];
    announced: string;
  };

  subscribers: Set<(state: unknown) => void>;
  timers: Set<ReturnType<typeof setTimeout>>;
  silenceTimer: ReturnType<typeof setTimeout> | null;
  replying: boolean;

  constructor({ silenceTimeoutMs } = {}) {
    this.answerIndex = 0;

    // The panel constructs its own client, so the behaviour suite cannot reach
    // this constructor: the window hook is its seam for the silence case.
    this.silenceTimeoutMs = silenceTimeoutMs
      ?? (typeof window !== "undefined" && (window as { __agentSilenceTimeoutMs?: number }).__agentSilenceTimeoutMs)
      ?? SILENCE_TIMEOUT_MS;
    this.state = { kind: "none", status: "idle", muted: false, thread: [], announced: "" };
    this.subscribers = new Set();
    this.timers = new Set();
    this.silenceTimer = null;
    this.replying = false;
  }

  subscribe(run) {
    this.subscribers.add(run);
    run(this.state);

    return () => this.subscribers.delete(run);
  }

  // A session starts on the first user act, never on opening the panel: text
  // for a typed send, voice for the waveform. Switching kinds ends the live
  // conversation first - context does not carry over, and the thread says so.
  startSession({ textOnly = false } = {}) {
    const kind = textOnly ? "text" : "voice";
    if (this.state.kind === kind) { return; }

    if (this.state.kind !== "none") { this.endSession("switched"); }

    if (textOnly) {
      this.state.kind = "text";
      this.#notify();
      return;
    }

    // The mic permission and the connection both live in this gap; Cancel
    // abandons before anything starts.
    this.state.kind = "voice";
    this.state.status = "connecting";
    this.state.muted = false;
    this.#notify();

    this.#after(this.#instant() ? 0 : CONNECT_MS, () => {
      if (this.state.status !== "connecting") { return; }

      if (this.#conversationRows() > 0) {
        this.state.thread = [...this.state.thread, { role: "divider", text: translate("newVoiceChat") }];
      }

      this.state.status = "listening";
      this.#notify();
      this.#armSilenceTimer();

      // The demo speaks first so the loop shows itself; tests drive utterances
      // explicitly through simulateUtterance.
      if (!this.#instant()) {
        this.#after(FIRST_UTTERANCE_MS, () => {
          if (this.state.status === "listening" && !this.state.muted) { this.simulateUtterance(); }
        });
      }
    });
  }

  // Typed asks work inside a voice call - same conversation, replies stay
  // spoken. A typed send while the agent is talking interrupts it, exactly
  // like speaking over it.
  sendUserMessage(text) {
    if (this.state.kind === "none") { this.startSession({ textOnly: true }); }
    if (this.state.status === "talking") { this.interrupt(); }

    this.#ask(text, { spoken: this.state.kind === "voice" });
  }

  // Keystrokes: the agent holds instead of talking over you.
  sendUserActivity() {
    if (this.state.kind === "voice") { this.#armSilenceTimer(); }
  }

  // The keyboard toggle mid-call: mic off, composer back, call still live.
  setMicMuted(muted) {
    if (this.state.kind !== "voice") { return; }

    this.state.muted = muted;
    this.#notify();
    this.#armSilenceTimer();
  }

  // Speaking over the agent, tapping the strip, or a typed send mid-reply.
  interrupt() {
    if (!this.replying) { return; }

    this.stopReply?.();
  }

  // The End pill, the widget's x, teardown, or the silence timeout. Ending
  // keeps the thread; a voice call marks where it stopped.
  endSession(reason = "ended") {
    if (this.state.kind === "none") { return; }

    const wasVoice = this.state.kind === "voice" && this.state.status !== "connecting";

    this.stopReply?.();
    this.#clearTimers();

    this.state.kind = "none";
    this.state.status = "idle";
    this.state.muted = false;

    if (wasVoice && reason !== "switched") {
      this.state.thread = [...this.state.thread, { role: "divider", text: translate("chatEnded") }];
    }

    this.#notify();
  }

  // Cancel during "Connecting…": nothing started, nothing to mark.
  cancelConnect() {
    if (this.state.status !== "connecting") { return; }

    this.#clearTimers();
    this.state.kind = "none";
    this.state.status = "idle";
    this.#notify();
  }

  // What the reader said, delivered per utterance once they finish - there is
  // no word-by-word transcript in the strip. Tests and the demo both use this.
  simulateUtterance(text = MOCK_UTTERANCE) {
    if (this.state.kind !== "voice" || this.state.muted) { return; }
    if (this.state.status === "talking") { this.interrupt(); }

    this.#ask(text, { spoken: true });
  }

  // A locked agent takes the question without a session and answers with the
  // publisher's offer; the panel supplies no copy of its own.
  appendLocked(text) {
    this.state.thread = [...this.state.thread, { role: "reader", text }, { role: "locked" }];
    this.#notify();
  }

  // private

  #ask(text, { spoken = false } = {}) {
    const reply = { role: "agent", text: "", citations: [], streaming: true, typing: true, spoken };

    this.state.thread = [...this.state.thread, { role: "reader", text }, reply];
    if (spoken && this.state.kind === "voice") { this.state.status = "talking"; }
    this.replying = true;
    this.#disarmSilenceTimer();
    this.#notify();

    const answer = SCRIPTED_ANSWERS[this.answerIndex % SCRIPTED_ANSWERS.length];
    this.answerIndex += 1;

    // Deltas arrive token-sized, so split on word boundaries: three big jumps
    // does not read as an answer being written.
    const deltas = answer.text.match(/\S+\s*/g) || [];

    const finish = (interrupted) => {
      reply.streaming = false;
      reply.typing = false;
      reply.citations = interrupted ? [] : answer.citations;
      this.replying = false;
      this.stopReply = null;
      this.state.announced = reply.text;

      // After a spoken reply the call returns to listening - no button between
      // turns, just speak.
      if (this.state.kind === "voice" && this.state.status === "talking") {
        this.state.status = "listening";
        this.#armSilenceTimer();
      }

      this.#notify();
    };

    let index = 0;
    let timer;

    const deliver = () => {
      if (index >= deltas.length) { finish(false); return; }

      reply.typing = false;
      reply.text += deltas[index];
      index += 1;
      this.#notify();

      timer = this.#after(this.#instant() ? 0 : 45, deliver);
    };

    this.stopReply = () => {
      clearTimeout(timer);
      this.timers.delete(timer);
      finish(true);
    };

    if (this.#instant()) {
      deltas.forEach((delta) => { reply.text += delta; });
      index = deltas.length;
      finish(false);
    } else {
      timer = this.#after(550, deliver);
    }
  }

  stopReply: (() => void) | null = null;

  #conversationRows() {
    return this.state.thread.filter((row: { role?: string }) => row.role !== "divider").length;
  }

  // Voice minutes only count while a call is live, so an idle call hangs up
  // by itself. Anything the reader does re-arms it.
  #armSilenceTimer() {
    this.#disarmSilenceTimer();
    if (this.state.kind !== "voice" || this.state.status !== "listening") { return; }

    this.silenceTimer = setTimeout(() => this.endSession("silence"), this.silenceTimeoutMs);
  }

  #disarmSilenceTimer() {
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); }
    this.silenceTimer = null;
  }

  #after(ms, fn) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);

    this.timers.add(timer);
    return timer;
  }

  #clearTimers() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.#disarmSilenceTimer();
  }

  #instant() {
    return typeof window !== "undefined" && (window as { disableAnimation?: boolean }).disableAnimation;
  }

  #notify() {
    // A fresh object so Svelte's store contract sees a change.
    this.state = { ...this.state };
    this.subscribers.forEach((run) => run(this.state));
  }
}

export default MockAgentClient;
