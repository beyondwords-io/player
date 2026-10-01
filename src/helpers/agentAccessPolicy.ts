import type { AgentMessage } from "./agentContracts";

type AgentLimit = number | null;
type AgentSpentReason = "questions" | "voice" | null;

interface AgentAccessPolicyInput {
  questionsLimit: AgentLimit;
  questionsRemaining: AgentLimit;
  voiceSecondsLimit: AgentLimit;
  voiceSecondsRemaining: AgentLimit;
  voiceEnabled: boolean;
  thread: AgentMessage[];
}

interface AgentAccessPolicy {
  budgetSpent: boolean;
  locked: boolean;
  lockedAsked: boolean;
  questionsUsed: number;
  showQuestionCounter: boolean;
  spentReason: AgentSpentReason;
  textAvailable: boolean;
  voiceAvailable: boolean;
}

const deriveAgentAccessPolicy = ({
  questionsLimit,
  questionsRemaining,
  voiceSecondsLimit,
  voiceSecondsRemaining,
  voiceEnabled,
  thread,
}: AgentAccessPolicyInput): AgentAccessPolicy => {
  const textAvailable = questionsRemaining === null || questionsRemaining > 0;
  const voiceAvailable = voiceEnabled && (voiceSecondsRemaining === null || voiceSecondsRemaining > 0);
  const locked = questionsLimit === 0 && (!voiceEnabled || voiceSecondsLimit === 0);
  const lockedAsked = locked && thread.length > 0;
  const budgetSpent = !locked && !textAvailable && !voiceAvailable;
  const questionsUsed = questionsLimit === null
    ? 0
    : Math.max(0, questionsLimit - (questionsRemaining || 0));
  const showQuestionCounter = questionsLimit !== null
    && questionsLimit > 0
    && questionsUsed >= 1
    && !budgetSpent;
  const spentReason = budgetSpent && questionsLimit !== null
    && questionsLimit > 0
    && questionsRemaining === 0
    ? "questions"
    : budgetSpent ? "voice" : null;

  return {
    budgetSpent,
    locked,
    lockedAsked,
    questionsUsed,
    showQuestionCounter,
    spentReason,
    textAvailable,
    voiceAvailable,
  };
};

export default deriveAgentAccessPolicy;
export type { AgentAccessPolicy, AgentAccessPolicyInput, AgentLimit, AgentSpentReason };
