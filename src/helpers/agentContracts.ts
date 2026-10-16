import type { Readable } from "svelte/store";

type AgentSessionKind = "none" | "text" | "voice";
type AgentSessionStatus = "idle" | "connecting" | "listening" | "talking";
type AgentEndReason = "ended" | "switched" | "silence" | "budget"
  | "disconnected" | "cancelled" | "failed";

// "forbidden" / "rate_limited" are reserved for later, not added yet.
type AgentErrorCode =
  | "not_configured"
  | "agent_unavailable"
  | "invalid_request"
  | "network"
  | "sdk_load_failed"
  | "mic_denied"
  | "mic_unavailable"
  | "connection_failed"
  | "disconnected";

interface AgentError {
  code: AgentErrorCode;
  message?: string;
  // The attempted session mode, set by start failures only: present means the
  // failure is retriable; absent on "disconnected" errors.
  mode?: "text" | "voice";
}

// What happened to a sent message: delivered to the live conversation, queued
// until the session connects, or dropped without a session to deliver into.
type AgentDelivery = "sent" | "queued" | "dropped";

type AgentOpResult = { ok: true } | { ok: false; reason: string };

interface AgentCitation {
  title: string;
  url: string;
}

interface AgentReaderMessage {
  role: "reader";
  text: string;
}

interface AgentReplyMessage {
  role: "agent";
  text: string;
  citations: AgentCitation[];
  citationCandidates?: AgentCitation[];
  streaming: boolean;
  typing: boolean;
  spoken: boolean;
  interrupted?: boolean;
  eventId?: number;
  fromParts?: boolean;
  sessionEpoch?: number;
}

interface AgentDividerMessage {
  role: "divider";
  text: string;
}

interface AgentLockedMessage {
  role: "locked";
}

type AgentMessage = AgentReaderMessage | AgentReplyMessage | AgentDividerMessage | AgentLockedMessage;

interface AgentState {
  kind: AgentSessionKind;
  status: AgentSessionStatus;
  muted: boolean;
  thread: AgentMessage[];
  announced: string;
  error: AgentError | null;
  lastEnd: AgentEndReason | null;
}

interface AgentSessionOptions {
  textOnly?: boolean;
}

interface AgentSessionConfig {
  firstMessage?: string;
  language?: string;
  model?: string;
  systemPrompt?: string;
  voiceId?: string;
  voiceModelId?: string;
}

interface AgentClient extends Readable<AgentState> {
  readonly canInterrupt: boolean;
  state: AgentState;
  // Facade hook: queued (undelivered) messages were flushed or discarded.
  onQueueSettled?: ((outcome: "delivered" | "dropped", count: number) => void) | null;
  startSession(options?: AgentSessionOptions): void | Promise<void>;
  sendUserMessage(text: string): AgentDelivery;
  sendUserActivity(): void;
  setMicMuted(muted: boolean): void;
  interrupt(): void;
  endSession(reason?: AgentEndReason): void;
  cancelConnect(): void;
  appendLocked(text: string): void;
  // Low-level re-attempt of the last failed startSession; the facade gates it
  // against policy before calling through.
  retry(): AgentOpResult;
  clearError(): AgentOpResult;
}

export type {
  AgentCitation,
  AgentClient,
  AgentDelivery,
  AgentDividerMessage,
  AgentEndReason,
  AgentError,
  AgentErrorCode,
  AgentLockedMessage,
  AgentMessage,
  AgentOpResult,
  AgentReaderMessage,
  AgentReplyMessage,
  AgentSessionConfig,
  AgentSessionKind,
  AgentSessionOptions,
  AgentSessionStatus,
  AgentState,
};
