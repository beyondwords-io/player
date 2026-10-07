import { normalizeAgentLimit, remainingAgentLimit } from "../../src/helpers/agentLimits";

describe("agent limits", () => {
  it("normalizes null, zero and positive integer allowances", () => {
    expect(normalizeAgentLimit(null)).toBeNull();
    expect(normalizeAgentLimit(undefined)).toBeNull();
    expect(normalizeAgentLimit(0)).toEqual(0);
    expect(normalizeAgentLimit(3)).toEqual(3);
    expect(normalizeAgentLimit("30")).toEqual(30);
  });

  it("treats malformed, fractional and negative allowances as unlimited", () => {
    expect(normalizeAgentLimit(-1)).toBeNull();
    expect(normalizeAgentLimit(1.5)).toBeNull();
    expect(normalizeAgentLimit("invalid")).toBeNull();
  });

  it("subtracts usage without taking an allowance below zero", () => {
    expect(remainingAgentLimit(null, 50)).toBeNull();
    expect(remainingAgentLimit(3, 1)).toEqual(2);
    expect(remainingAgentLimit(3, 5)).toEqual(0);
  });
});
