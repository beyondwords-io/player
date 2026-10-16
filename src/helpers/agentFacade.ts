import type { Readable, Subscriber, Unsubscriber } from "svelte/store";
import deriveAgentAccessPolicy from "./agentAccessPolicy";
import type { AgentAccessPolicy } from "./agentAccessPolicy";
import type AgentAllowanceState from "./agentAllowanceState";
import type { AgentAllowanceSnapshot } from "./agentAllowanceState";
import type {
  AgentCitation,
  AgentClient,
  AgentEndReason,
  AgentError,
  AgentMessage,
  AgentReplyMessage,
  AgentSessionKind,
  AgentSessionStatus,
  AgentState,
} from "./agentContracts";
import { agentCitationsFromText, agentTextWithoutLinks, mergeAgentCitations } from "./agentLinks";

// The public player.agent surface: one stable facade per player, exposed as a
// readonly instance member. It merges the agent client (which Player.svelte
// REPLACES whenever agentId/sessionConfig/auth props change), the allowance
// and the access policy into one immutable, reference-stable snapshot, and it
// owns policy and metering enforcement so every caller - the default
// ChatPanel, a publisher script, a React wrapper - goes through one gate.
//
// Identity: the facade never changes, whatever happens to the client under it.
// setClient (Player.svelte wiring only) detaches the old client's subscription
// and queue hook and attaches the new one's; facade subscribers never
// resubscribe. syncAgentClient ends the old session before the swap, so the
// kind -> "none" transition flows through the still-attached subscription and
// the swap itself never emits a session event (the new client starts at
// "none": no diff).
//
// Snapshots: getState() returns the SAME object until something actually
// changed (useSyncExternalStore-safe), and everything reachable from it is
// facade-owned and frozen - mutating a snapshot never affects state. Derived
// thread rows are cached by client row identity: the client's copy-on-write
// rows make object identity a perfect change signal, so unchanged rows keep
// their derived object (and an in-place-mutating client would freeze the UI,
// which is why the mock client is copy-on-write too).

type AgentReplyPhase = "typing" | "streaming" | "final" | "interrupted";

interface AgentSnapshotReply {
  role: "agent";
  text: string; // raw
  displayText: string; // links moved to citations, blank-line runs capped
  citations: AgentCitation[];
  phase: AgentReplyPhase;
  spoken: boolean;
  // Client-flag mirrors, so ChatThread renders rows unchanged.
  streaming: boolean;
  typing: boolean;
  interrupted: boolean;
}

interface AgentSnapshotReader { role: "reader"; text: string }
interface AgentSnapshotDivider { role: "divider"; text: string }
interface AgentSnapshotLocked { role: "locked" }
type AgentSnapshotRow = AgentSnapshotReader | AgentSnapshotReply | AgentSnapshotDivider | AgentSnapshotLocked;

// text is display-transformed; id bumps on every change so aria-live
// consumers can re-announce identical text.
interface AgentAnnouncement { id: number; text: string }

interface AgentCta { text?: string; url?: string }

interface AgentUiConfig {
  name?: string;
  placeholder?: string;
  shortcuts: string[];
  avatar?: string;
  color?: string;
  voiceEnabled: boolean;
}

interface AgentSnapshot {
  configured: boolean;
  kind: AgentSessionKind;
  status: AgentSessionStatus;
  muted: boolean;
  canInterrupt: boolean;
  streaming: boolean; // the last row is an agent row still streaming
  thread: readonly AgentSnapshotRow[];
  announcement: AgentAnnouncement | null;
  error: AgentError | null;
  lastEnd: AgentEndReason | null;
  allowance: AgentAllowanceSnapshot;
  policy: AgentAccessPolicy;
  embedMode: string;
  widgetEmbedMode: string;
  cta: AgentCta | null;
  config: AgentUiConfig;
  offline: boolean;
}

type AgentActionReason = "empty" | "not_configured" | "locked" | "budget_spent"
  | "no_questions_remaining" | "voice_unavailable" | "busy" | "no_session"
  | "no_call" | "not_connecting" | "nothing_to_retry";

type AgentActionResult = { ok: true } | { ok: false; reason: AgentActionReason };

interface AgentSendOptions { source?: "composer" | "shortcut" | "api"; pressedEventId?: string }

interface AgentStartOptions { mode?: "text" | "voice" } // default "voice" (matches the client default)

interface AgentFacadeContext {
  configured: boolean;
  embedMode: string;
  widgetEmbedMode: string;
  cta: AgentCta | null;
  config: AgentUiConfig;
}

type AgentEmit = (props: { type: string; description: string; initiatedBy: "agent" } & Record<string, unknown>) => void;

interface AgentFacadeOptions {
  client: AgentClient;
  allowance: AgentAllowanceState;
  emit?: AgentEmit;
}

const displayAgentText = (text: string): string => (
  agentTextWithoutLinks(text)
    // Preserve the agent's line structure, but cap runs of empty lines at one
    // ordinary paragraph break (mirrors ChatThread's formattedAnswer).
    .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
);

// Matches Player.svelte's prop defaults, so the constructor's eager recompute
// never reads an unspecified context and a default/real mismatch cannot show.
const defaultContext = (): AgentFacadeContext => ({
  configured: false,
  embedMode: "audio",
  widgetEmbedMode: "audio",
  cta: null,
  config: { shortcuts: [], voiceEnabled: true },
});

const emptyAllowance = (): AgentAllowanceSnapshot => ({
  questionsLimit: null,
  questionsRemaining: null,
  questionsUsed: 0,
  voiceSecondsLimit: null,
  voiceSecondsRemaining: null,
  voiceSecondsUsed: 0,
});

class AgentFacade implements Readable<AgentSnapshot> {
  #client: AgentClient;
  #allowance: AgentAllowanceState;
  #emit: AgentEmit | null;

  #subscribers = new Set<Subscriber<AgentSnapshot>>();
  #clientUnsub: Unsubscriber | null = null;
  #allowanceUnsub: Unsubscriber | null = null;

  #context: AgentFacadeContext;
  #contextKey = "";

  #clientState: AgentState;
  #allowanceSource: AgentAllowanceSnapshot;
  #offline: boolean;

  #snapshot: AgentSnapshot | null = null;

  // Derived-value caches, each keyed on its inputs' identity.
  #rowCache = new WeakMap<AgentMessage, AgentSnapshotRow>();
  #threadSource: AgentMessage[] | null = null;
  #thread: readonly AgentSnapshotRow[] = Object.freeze([]);
  #allowanceCopySource: AgentAllowanceSnapshot | null = null;
  #allowanceCopy: AgentAllowanceSnapshot | null = null;
  #policy: AgentAccessPolicy | null = null;
  #policyAllowance: AgentAllowanceSnapshot | null = null;
  #policyVoiceEnabled: boolean | null = null;
  #policyThread: AgentMessage[] | null = null;
  #errorSource: AgentError | null | undefined = undefined;
  #error: AgentError | null = null;
  #announcement: AgentAnnouncement | null = null;
  #announcedRaw = "";
  #announceSeq = 0;

  // Event emission stays silent until the first updateContext has applied the
  // real context and the trackers below are seeded from the resulting
  // snapshot - so constructing a player emits nothing, by construction.
  #primed = false;
  #lastKind: AgentSessionKind = "none";
  #lastStatus: AgentSessionStatus = "idle";
  #lastErrorCode: string | null = null;
  #lastFinalCount = 0;
  #lastPolicy: { textAvailable: boolean; voiceAvailable: boolean; locked: boolean; budgetSpent: boolean } | null = null;
  #lastAllowance: AgentAllowanceSnapshot | null = null;

  // Questions reserved for messages still queued (metered facade sends that
  // returned "queued"). Refunded only if they are dropped before delivery.
  #reservedQueued = 0;

  #onOnline = (): void => { this.#offline = false; this.#recompute(); };
  #onOffline = (): void => { this.#offline = true; this.#recompute(); };

  constructor({ client, allowance, emit }: AgentFacadeOptions) {
    this.#allowance = allowance;
    this.#emit = emit ?? null;

    this.#context = this.#freezeContext(defaultContext());
    this.#allowanceSource = emptyAllowance();

    this.#offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.#onOnline);
      window.addEventListener("offline", this.#onOffline);
    }

    // Both stores deliver their current value synchronously on subscribe, so
    // construction ends with a complete snapshot (and no emissions: unprimed).
    this.#attachClient(client);
    this.#allowanceUnsub = allowance.subscribe((snapshot) => this.#onAllowance(snapshot));
  }

  subscribe(run: Subscriber<AgentSnapshot>): Unsubscriber {
    this.#subscribers.add(run);
    run(this.getState());
    return () => { this.#subscribers.delete(run); };
  }

  // The cached snapshot: the same reference until something changed.
  getState(): AgentSnapshot {
    return this.#snapshot;
  }

  // Player.svelte wiring only: syncAgentClient replaces the whole client, and
  // the facade re-attaches so its subscribers never resubscribe. The old
  // client's endSession already flushed its end (and any queue drop) through
  // the still-attached subscription before the swap.
  setClient(client: AgentClient): void {
    if (client === this.#client) { return; }

    this.#detachClient();
    this.#reservedQueued = 0;
    this.#attachClient(client);
  }

  // Applies Player props. The first call primes the facade: it applies the
  // context, recomputes, seeds every emission tracker from the resulting
  // snapshot without emitting, and only then allows events out.
  updateContext(context: AgentFacadeContext): void {
    // The Player reactive statement re-runs on unrelated prop changes.
    const key = JSON.stringify(context);
    if (this.#primed && key === this.#contextKey) { return; }

    this.#contextKey = key;
    this.#context = this.#freezeContext(context);
    this.#recompute();
    this.#primed = true;
  }

  destroy(): void {
    this.#detachClient();
    this.#allowanceUnsub?.();
    this.#allowanceUnsub = null;

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.#onOnline);
      window.removeEventListener("offline", this.#onOffline);
    }

    this.#subscribers.clear();
    this.#emit = null;
  }

  startSession({ mode = "voice" }: AgentStartOptions = {}): AgentActionResult {
    const gate = this.#gateStart(mode);
    if (!gate.ok) { return gate; }

    this.#client.startSession({ textOnly: mode === "text" });
    return { ok: true };
  }

  sendMessage(text: string, { source = "api", pressedEventId }: AgentSendOptions = {}): AgentActionResult {
    const trimmed = (text ?? "").trim();

    // AgentMessageRejected fires for EVERY rejection, "locked" included (a
    // composer restores its input via pressedEventId). Reason "locked" is the
    // documented exception a composer must NOT restore for: the question was
    // consumed into the thread and rendered with the publisher's offer.
    const rejected = (reason: AgentActionReason): AgentActionResult => {
      this.#emit?.({
        type: "AgentMessageRejected",
        description: "A message to the agent was rejected.",
        initiatedBy: "agent",
        reason,
        ...(pressedEventId ? { pressedEventId } : {}),
      });
      return { ok: false, reason };
    };

    if (!trimmed) { return rejected("empty"); }
    // No agent: no thread row, no metering (a dead composer stays honest).
    if (!this.#context.configured) { return rejected("not_configured"); }

    const policy = this.getState().policy;
    if (policy.locked) {
      this.#client.appendLocked(trimmed);
      return rejected("locked");
    }
    if (policy.budgetSpent) { return rejected("budget_spent"); }
    if (!policy.textAvailable) { return rejected("no_questions_remaining"); }

    const state = this.#client.state;
    const last = state.thread[state.thread.length - 1];
    if (state.kind !== "voice" && last?.role === "agent" && last.streaming) { return rejected("busy"); }

    const delivery = this.#client.sendUserMessage(trimmed);
    if (delivery === "dropped") { return rejected("not_configured"); }

    this.#allowance.useQuestion();
    if (delivery === "queued") { this.#reservedQueued += 1; }

    // Never the text: events carry ids, the text travels through this call.
    this.#emit?.({
      type: "AgentMessageSent",
      description: "A message was sent to the agent.",
      initiatedBy: "agent",
      source,
      ...(pressedEventId ? { pressedEventId } : {}),
    });
    return { ok: true };
  }

  endSession(): AgentActionResult {
    if (this.#client.state.kind === "none") { return { ok: false, reason: "no_session" }; }

    this.#client.endSession();
    return { ok: true };
  }

  cancelConnect(): AgentActionResult {
    if (this.#client.state.status !== "connecting") { return { ok: false, reason: "not_connecting" }; }

    this.#client.cancelConnect();
    return { ok: true };
  }

  setMicMuted(muted: boolean): AgentActionResult {
    if (this.#client.state.kind !== "voice") { return { ok: false, reason: "no_call" }; }

    this.#client.setMicMuted(!!muted);
    return { ok: true };
  }

  interrupt(): AgentActionResult {
    this.#client.interrupt();
    return { ok: true };
  }

  notifyActivity(): AgentActionResult {
    this.#client.sendUserActivity();
    return { ok: true };
  }

  retry(): AgentActionResult {
    // mode is set only by start failures, so only those are retriable.
    const mode = this.#client.state.error?.mode;
    if (!mode) { return { ok: false, reason: "nothing_to_retry" }; }

    // Policy may have changed since the failure: a retry must not mic-prompt
    // or open an unmetered call once voice is no longer available.
    const gate = this.#gateStart(mode);
    if (!gate.ok) { return gate; }

    return this.#client.retry() as AgentActionResult;
  }

  clearError(): AgentActionResult {
    return this.#client.clearError() as AgentActionResult;
  }

  // private

  #attachClient(client: AgentClient): void {
    this.#client = client;
    this.#clientState = this.#captureClientState(client.state);
    client.onQueueSettled = (outcome, count) => this.#onQueueSettled(outcome, count);
    this.#clientUnsub = client.subscribe((state) => this.#onClientState(state));
  }

  #detachClient(): void {
    this.#clientUnsub?.();
    this.#clientUnsub = null;
    if (this.#client) { this.#client.onQueueSettled = null; }
  }

  #onClientState(state: AgentState): void {
    this.#clientState = this.#captureClientState(state);
    this.#recompute();
  }

  // The client mutates its state object in place between notifies (it clones
  // only when it notifies), and the queue-settled hook can trigger a recompute
  // mid-update (refund -> allowance notify). Capturing the notified fields
  // keeps every recompute on the last PUBLISHED client state, so a failed
  // start stays one diff: AgentErrored then AgentSessionEnded, in that order,
  // from the client's single notify.
  #captureClientState(state: AgentState): AgentState {
    return {
      kind: state.kind,
      status: state.status,
      muted: state.muted,
      thread: state.thread,
      announced: state.announced,
      error: state.error,
      lastEnd: state.lastEnd,
    };
  }

  #onAllowance(snapshot: AgentAllowanceSnapshot): void {
    // Budget-identity rebase: a reservation can never exceed the current
    // budget's used count, so an identity reset (used back to 0) zeroes stale
    // reservations and a dropped A-era message never refunds against B.
    this.#reservedQueued = Math.min(this.#reservedQueued, snapshot.questionsUsed);
    this.#allowanceSource = snapshot;
    this.#recompute();
  }

  // A question is refunded ONLY when its message never reached the server:
  // the client reports "dropped" from a failed start or a session that ended
  // with messages still queued, and "delivered" once a queue flushed. A Stop
  // during the typing dots never refunds - that message was already sent.
  #onQueueSettled(outcome: "delivered" | "dropped", count: number): void {
    if (outcome === "delivered") {
      this.#reservedQueued = Math.max(0, this.#reservedQueued - count);
      return;
    }

    // Decrement BEFORE refunding: each refundQuestion notifies synchronously
    // and #onAllowance's clamp re-reads #reservedQueued.
    const refunds = Math.min(count, this.#reservedQueued);
    this.#reservedQueued -= refunds;
    for (let i = 0; i < refunds; i += 1) { this.#allowance.refundQuestion(); }
  }

  // Shared by startSession AND retry, so a retry can never bypass the lock,
  // the budget, or voice availability (no mic prompt on a gated rejection).
  #gateStart(mode: "text" | "voice"): AgentActionResult {
    if (!this.#context.configured) { return { ok: false, reason: "not_configured" }; }

    const policy = this.getState().policy;
    if (policy.locked) { return { ok: false, reason: "locked" }; }
    if (mode === "voice" && !policy.voiceAvailable) {
      return { ok: false, reason: policy.budgetSpent ? "budget_spent" : "voice_unavailable" };
    }
    if (mode === "text" && !policy.textAvailable) {
      return { ok: false, reason: policy.budgetSpent ? "budget_spent" : "no_questions_remaining" };
    }
    return { ok: true };
  }

  #freezeContext(context: AgentFacadeContext): AgentFacadeContext {
    const shortcuts = [...(context.config?.shortcuts ?? [])];
    Object.freeze(shortcuts);

    const config: AgentUiConfig = {
      ...context.config,
      shortcuts,
      voiceEnabled: !!context.config?.voiceEnabled,
    };
    Object.freeze(config);

    const cta = context.cta ? Object.freeze({ ...context.cta }) : null;

    return Object.freeze({
      configured: !!context.configured,
      embedMode: context.embedMode,
      widgetEmbedMode: context.widgetEmbedMode,
      cta,
      config,
    });
  }

  // Eager recompute on every input notification; the snapshot object is kept
  // unless some top-level field changed by ===.
  #recompute(): void {
    const clientState = this.#clientState;
    const context = this.#context;

    const thread = this.#deriveThread(clientState.thread);
    this.#deriveAnnouncement(clientState.announced);
    this.#deriveError(clientState.error);
    this.#deriveAllowance();
    this.#derivePolicy(clientState.thread, context.config.voiceEnabled);

    const last = clientState.thread[clientState.thread.length - 1];
    const streaming = last?.role === "agent" && last.streaming === true;

    const next: AgentSnapshot = {
      configured: context.configured,
      kind: clientState.kind,
      status: clientState.status,
      muted: clientState.muted,
      canInterrupt: this.#client.canInterrupt,
      streaming,
      thread,
      announcement: this.#announcement,
      error: this.#error,
      lastEnd: clientState.lastEnd,
      allowance: this.#allowanceCopy,
      policy: this.#policy,
      embedMode: context.embedMode,
      widgetEmbedMode: context.widgetEmbedMode,
      cta: context.cta,
      config: context.config,
      offline: this.#offline,
    };

    const prev = this.#snapshot;
    const changed = !prev || Object.keys(next).some((key) => (
      (next as unknown as Record<string, unknown>)[key] !== (prev as unknown as Record<string, unknown>)[key]
    ));
    if (!changed) { return; }

    this.#snapshot = Object.freeze(next);
    this.#emitDiffs();
    this.#subscribers.forEach((run) => run(this.#snapshot));
  }

  #deriveThread(thread: AgentMessage[]): readonly AgentSnapshotRow[] {
    // Copy-on-write in the client makes array identity a perfect change signal.
    if (thread === this.#threadSource) { return this.#thread; }

    const rows = thread.map((row) => this.#deriveRow(row));
    Object.freeze(rows);
    this.#threadSource = thread;
    this.#thread = rows;
    return rows;
  }

  #deriveRow(row: AgentMessage): AgentSnapshotRow {
    // Changed rows get new identity in the client, so a cache hit is exact.
    const cached = this.#rowCache.get(row);
    if (cached) { return cached; }

    const derived = row.role === "agent" ? this.#deriveReply(row) : Object.freeze({ ...row });
    this.#rowCache.set(row, derived);
    return derived;
  }

  #deriveReply(row: AgentReplyMessage): AgentSnapshotReply {
    const phase: AgentReplyPhase = row.interrupted ? "interrupted"
      : row.typing ? "typing"
      : row.streaming ? "streaming"
      : "final";

    // Mirrors ChatThread's displayCitations: candidates from the text only
    // once the reply stopped streaming.
    const citations = mergeAgentCitations(row.citations, row.streaming ? [] : agentCitationsFromText(row.text));
    citations.forEach((citation) => Object.freeze(citation));
    Object.freeze(citations);

    return Object.freeze({
      role: "agent" as const,
      text: row.text,
      displayText: displayAgentText(row.text),
      citations,
      phase,
      spoken: row.spoken,
      streaming: row.streaming,
      typing: row.typing,
      interrupted: !!row.interrupted,
    });
  }

  #deriveAnnouncement(raw: string): void {
    if (raw === this.#announcedRaw) { return; }

    this.#announcedRaw = raw;
    this.#announceSeq += 1;
    this.#announcement = raw
      ? Object.freeze({ id: this.#announceSeq, text: displayAgentText(raw) })
      : null;
  }

  #deriveError(error: AgentError | null): void {
    if (error === this.#errorSource) { return; }

    this.#errorSource = error;
    this.#error = error ? Object.freeze({ ...error }) : null;
  }

  #deriveAllowance(): void {
    // AgentAllowanceState replaces its snapshot object on every change.
    if (this.#allowanceSource === this.#allowanceCopySource) { return; }

    this.#allowanceCopySource = this.#allowanceSource;
    this.#allowanceCopy = Object.freeze({ ...this.#allowanceSource });
  }

  #derivePolicy(thread: AgentMessage[], voiceEnabled: boolean): void {
    if (this.#policy
      && this.#policyAllowance === this.#allowanceSource
      && this.#policyVoiceEnabled === voiceEnabled
      && this.#policyThread === thread) { return; }

    this.#policyAllowance = this.#allowanceSource;
    this.#policyVoiceEnabled = voiceEnabled;
    this.#policyThread = thread;
    this.#policy = Object.freeze(deriveAgentAccessPolicy({
      questionsLimit: this.#allowanceSource.questionsLimit,
      questionsRemaining: this.#allowanceSource.questionsRemaining,
      voiceSecondsLimit: this.#allowanceSource.voiceSecondsLimit,
      voiceSecondsRemaining: this.#allowanceSource.voiceSecondsRemaining,
      voiceEnabled,
      thread,
    }));
  }

  // Output events, diffed per notification. Token/streaming deltas and row
  // text never become events - they are store-only (changedProps diff cost,
  // and D13 privacy: no question or answer text on the event bus).
  #emitDiffs(): void {
    const snapshot = this.#snapshot;

    const prevKind = this.#lastKind;
    const prevStatus = this.#lastStatus;
    const prevErrorCode = this.#lastErrorCode;
    const prevFinalCount = this.#lastFinalCount;
    const prevPolicy = this.#lastPolicy;
    const prevAllowance = this.#lastAllowance;

    const finalCount = snapshot.thread.filter((row) => row.role === "agent" && row.phase === "final").length;
    const errorCode = snapshot.error?.code ?? null;
    const policy = {
      textAvailable: snapshot.policy.textAvailable,
      voiceAvailable: snapshot.policy.voiceAvailable,
      locked: snapshot.policy.locked,
      budgetSpent: snapshot.policy.budgetSpent,
    };

    // Trackers always follow the snapshot; a client swap re-bases the reply
    // count downward without emitting (emission only fires on an increase).
    this.#lastKind = snapshot.kind;
    this.#lastStatus = snapshot.status;
    this.#lastErrorCode = errorCode;
    this.#lastFinalCount = finalCount;
    this.#lastPolicy = policy;
    this.#lastAllowance = snapshot.allowance;

    if (!this.#primed || !this.#emit) { return; }

    if (snapshot.kind !== prevKind && prevKind === "none") {
      this.#emit({
        type: "AgentSessionStarted",
        description: "An agent session started.",
        initiatedBy: "agent",
        mode: snapshot.kind,
      });
    }

    if (snapshot.status !== prevStatus) {
      this.#emit({
        type: "AgentStatusChanged",
        description: "The agent session status changed.",
        initiatedBy: "agent",
        status: snapshot.status,
      });
    }

    // The published error clear during a retry's connecting phase re-arms
    // this tracker, so a repeat failure with the same code re-emits.
    if (errorCode && errorCode !== prevErrorCode) {
      this.#emit({
        type: "AgentErrored",
        description: "The agent errored.",
        initiatedBy: "agent",
        code: errorCode,
      });
    }

    // After AgentErrored: a failed start reports the error, then the end.
    if (snapshot.kind !== prevKind && snapshot.kind === "none") {
      this.#emit({
        type: "AgentSessionEnded",
        description: "The agent session ended.",
        initiatedBy: "agent",
        reason: snapshot.lastEnd ?? "ended",
      });
    }

    // Once per reply (typing/streaming -> final); interrupted finalizations
    // and corrections do not increase the count.
    if (finalCount > prevFinalCount) {
      this.#emit({
        type: "AgentReplyCompleted",
        description: "The agent completed a reply.",
        initiatedBy: "agent",
      });
    }

    const allowance = snapshot.allowance;
    const allowanceChanged = !prevAllowance
      || allowance.questionsLimit !== prevAllowance.questionsLimit
      || allowance.questionsRemaining !== prevAllowance.questionsRemaining
      || allowance.questionsUsed !== prevAllowance.questionsUsed
      || allowance.voiceSecondsLimit !== prevAllowance.voiceSecondsLimit
      // The per-second voice tick stays store-only; only the 0-crossing emits.
      || (allowance.voiceSecondsRemaining === 0) !== (prevAllowance.voiceSecondsRemaining === 0);
    if (allowanceChanged) {
      this.#emit({
        type: "AgentAllowanceChanged",
        description: "The agent allowance changed.",
        initiatedBy: "agent",
      });
    }

    const policyChanged = !prevPolicy
      || policy.textAvailable !== prevPolicy.textAvailable
      || policy.voiceAvailable !== prevPolicy.voiceAvailable
      || policy.locked !== prevPolicy.locked
      || policy.budgetSpent !== prevPolicy.budgetSpent;
    if (policyChanged) {
      this.#emit({
        type: "AgentAvailabilityChanged",
        description: "The agent availability changed.",
        initiatedBy: "agent",
        ...policy,
      });
    }
  }
}

export default AgentFacade;
export type {
  AgentActionReason,
  AgentActionResult,
  AgentAnnouncement,
  AgentCta,
  AgentEmit,
  AgentFacadeContext,
  AgentFacadeOptions,
  AgentReplyPhase,
  AgentSendOptions,
  AgentSnapshot,
  AgentSnapshotDivider,
  AgentSnapshotLocked,
  AgentSnapshotReader,
  AgentSnapshotReply,
  AgentSnapshotRow,
  AgentStartOptions,
  AgentUiConfig,
};
