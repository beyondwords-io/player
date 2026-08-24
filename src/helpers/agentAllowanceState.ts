import type { Readable, Subscriber, Unsubscriber } from "svelte/store";
import { normalizeAgentLimit, remainingAgentLimit } from "./agentLimits";
import type { AgentLimit } from "./agentAccessPolicy";

interface AgentAllowanceSnapshot {
  questionsLimit: AgentLimit;
  questionsRemaining: AgentLimit;
  questionsUsed: number;
  voiceSecondsLimit: AgentLimit;
  voiceSecondsRemaining: AgentLimit;
  voiceSecondsUsed: number;
}

interface AgentAllowanceConfig {
  identity: string;
  questionsLimit: unknown;
  voiceSecondsLimit: unknown;
}

interface AgentAllowanceOptions {
  clearIntervalFn?: typeof clearInterval;
  onVoiceExhausted?: () => void;
  setIntervalFn?: typeof setInterval;
}

class AgentAllowanceState implements Readable<AgentAllowanceSnapshot> {
  #clearInterval: typeof clearInterval;
  #identity: string | undefined;
  #onVoiceExhausted: () => void;
  #setInterval: typeof setInterval;
  #subscribers = new Set<Subscriber<AgentAllowanceSnapshot>>();
  #timer: ReturnType<typeof setInterval> | undefined;
  #voiceLive = false;
  #snapshot: AgentAllowanceSnapshot = {
    questionsLimit: null,
    questionsRemaining: null,
    questionsUsed: 0,
    voiceSecondsLimit: null,
    voiceSecondsRemaining: null,
    voiceSecondsUsed: 0,
  };

  constructor({ clearIntervalFn, onVoiceExhausted, setIntervalFn }: AgentAllowanceOptions = {}) {
    this.#clearInterval = clearIntervalFn ?? globalThis.clearInterval.bind(globalThis);
    this.#onVoiceExhausted = onVoiceExhausted ?? (() => {});
    this.#setInterval = setIntervalFn ?? globalThis.setInterval.bind(globalThis);
  }

  subscribe(run: Subscriber<AgentAllowanceSnapshot>): Unsubscriber {
    this.#subscribers.add(run);
    run(this.#snapshot);
    return () => this.#subscribers.delete(run);
  }

  configure({ identity, questionsLimit, voiceSecondsLimit }: AgentAllowanceConfig): void {
    if (identity === this.#identity) { return; }

    this.#identity = identity;
    const normalizedQuestionsLimit = normalizeAgentLimit(questionsLimit);
    const normalizedVoiceSecondsLimit = normalizeAgentLimit(voiceSecondsLimit);
    this.#snapshot = {
      questionsLimit: normalizedQuestionsLimit,
      questionsRemaining: normalizedQuestionsLimit,
      questionsUsed: 0,
      voiceSecondsLimit: normalizedVoiceSecondsLimit,
      voiceSecondsRemaining: normalizedVoiceSecondsLimit,
      voiceSecondsUsed: 0,
    };
    this.#notify();
    this.#syncTimer();
  }

  useQuestion(): void {
    const { questionsLimit, questionsRemaining, questionsUsed } = this.#snapshot;
    if (questionsRemaining === null || questionsRemaining === 0) { return; }

    const nextUsed = questionsUsed + 1;
    this.#snapshot = {
      ...this.#snapshot,
      questionsUsed: nextUsed,
      questionsRemaining: remainingAgentLimit(questionsLimit, nextUsed),
    };
    this.#notify();
  }

  setVoiceLive(live: boolean): void {
    if (live === this.#voiceLive) { return; }
    this.#voiceLive = live;
    this.#syncTimer();
  }

  destroy(): void {
    this.#stopTimer();
    this.#subscribers.clear();
  }

  #syncTimer(): void {
    const remaining = this.#snapshot.voiceSecondsRemaining;
    const shouldRun = this.#voiceLive && remaining !== null && remaining > 0;

    if (shouldRun && !this.#timer) {
      this.#timer = this.#setInterval(() => this.#tickVoice(), 1000);
    } else if (!shouldRun) {
      this.#stopTimer();
    }
  }

  #tickVoice(): void {
    const { voiceSecondsLimit, voiceSecondsRemaining, voiceSecondsUsed } = this.#snapshot;
    if (!this.#voiceLive || voiceSecondsRemaining === null || voiceSecondsRemaining === 0) {
      this.#syncTimer();
      return;
    }

    const nextUsed = voiceSecondsUsed + 1;
    const nextRemaining = remainingAgentLimit(voiceSecondsLimit, nextUsed);
    this.#snapshot = {
      ...this.#snapshot,
      voiceSecondsUsed: nextUsed,
      voiceSecondsRemaining: nextRemaining,
    };
    this.#notify();

    if (nextRemaining === 0) {
      this.#stopTimer();
      this.#onVoiceExhausted();
    }
  }

  #stopTimer(): void {
    if (this.#timer !== undefined) { this.#clearInterval(this.#timer); }
    this.#timer = undefined;
  }

  #notify(): void {
    this.#subscribers.forEach((run) => run(this.#snapshot));
  }
}

export default AgentAllowanceState;
export type { AgentAllowanceConfig, AgentAllowanceOptions, AgentAllowanceSnapshot };
