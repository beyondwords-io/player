import deriveAgentAccessPolicy from "../../src/helpers/agentAccessPolicy";
import type { AgentMessage } from "../../src/helpers/agentContracts";

const policy = (overrides = {}) => deriveAgentAccessPolicy({
  questionsLimit: null,
  questionsRemaining: null,
  voiceSecondsLimit: null,
  voiceSecondsRemaining: null,
  voiceEnabled: true,
  thread: [] as AgentMessage[],
  ...overrides,
});

describe("agent access policy", () => {
  it("keeps text and voice allowances independent", () => {
    expect(policy({ questionsLimit: 0, questionsRemaining: 0, voiceSecondsLimit: 60, voiceSecondsRemaining: 60 })).toMatchObject({
      locked: false,
      textAvailable: false,
      voiceAvailable: true,
      budgetSpent: false,
    });

    expect(policy({ questionsLimit: 3, questionsRemaining: 2, voiceSecondsLimit: 0, voiceSecondsRemaining: 0 })).toMatchObject({
      locked: false,
      textAvailable: true,
      voiceAvailable: false,
      questionsUsed: 1,
      showQuestionCounter: true,
    });
  });

  it("distinguishes an initial lock from a spent allowance", () => {
    expect(policy({ questionsLimit: 0, questionsRemaining: 0, voiceSecondsLimit: 0, voiceSecondsRemaining: 0 })).toMatchObject({
      locked: true,
      lockedAsked: false,
      budgetSpent: false,
    });

    expect(policy({
      questionsLimit: 0,
      questionsRemaining: 0,
      voiceSecondsLimit: 0,
      voiceSecondsRemaining: 0,
      thread: [{ role: "reader", text: "Why?" }, { role: "locked" }],
    })).toMatchObject({ locked: true, lockedAsked: true });
  });

  it("identifies which allowance supplied the spent message", () => {
    expect(policy({ questionsLimit: 1, questionsRemaining: 0, voiceSecondsLimit: 0, voiceSecondsRemaining: 0 }).spentReason).toEqual("questions");
    expect(policy({ questionsLimit: 0, questionsRemaining: 0, voiceSecondsLimit: 1, voiceSecondsRemaining: 0 }).spentReason).toEqual("voice");
  });
});
