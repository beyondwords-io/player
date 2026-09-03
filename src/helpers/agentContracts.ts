import type { Readable } from "svelte/store";

type AgentSessionKind = "none" | "text" | "voice";
type AgentSessionStatus = "idle" | "connecting" | "listening" | "talking";
type AgentEndReason = "ended" | "switched" | "silence" | "budget";

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
  startSession(options?: AgentSessionOptions): void | Promise<void>;
  sendUserMessage(text: string): void;
  sendUserActivity(): void;
  setMicMuted(muted: boolean): void;
  interrupt(): void;
  endSession(reason?: AgentEndReason): void;
  cancelConnect(): void;
  appendLocked(text: string): void;
}

export type {
  AgentCitation,
  AgentClient,
  AgentDividerMessage,
  AgentEndReason,
  AgentLockedMessage,
  AgentMessage,
  AgentReaderMessage,
  AgentReplyMessage,
  AgentSessionConfig,
  AgentSessionKind,
  AgentSessionOptions,
  AgentSessionStatus,
  AgentState,
};
