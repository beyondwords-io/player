import type { Readable } from "svelte/store";

type AgentSessionKind = "none" | "text" | "voice";
type AgentSessionStatus = "idle" | "connecting" | "listening" | "talking";
type AgentEndReason = "ended" | "switched" | "silence" | "budget";

interface AgentCitation {
  title: string;
  url: string;
}

// A stretch of the displayed answer - usually one sentence - followed by the
// sources it names, so each headline carries its own link.
interface AgentReplySegment {
  text: string;
  citations: AgentCitation[];
}

// segments joined are the displayed answer; trailing are cited without a
// sentence to sit beside, and show as a row under it.
interface AgentReplyLayout {
  segments: AgentReplySegment[];
  trailing: AgentCitation[];
}

interface AgentReaderMessage {
  role: "reader";
  text: string;
}

interface AgentReplyMessage {
  role: "agent";
  text: string;
  // Every citation shown, inline ones first, in display order.
  citations: AgentCitation[];
  // Set once the reply is final; without it the thread lays out text and
  // citations itself.
  layout?: AgentReplyLayout;
  // "Let me have a look": a reply the agent followed with a tool call in the
  // same turn. It never cites the articles the tools return.
  bridge?: boolean;
  streaming: boolean;
  typing: boolean;
  spoken: boolean;
  interrupted?: boolean;
  eventId?: number;
  responseId?: string;
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
  AgentReplyLayout,
  AgentReplyMessage,
  AgentReplySegment,
  AgentSessionConfig,
  AgentSessionKind,
  AgentSessionOptions,
  AgentSessionStatus,
  AgentState,
};
