type AgentLimit = number | null;

const normalizeAgentLimit = (value: unknown): AgentLimit => {
  if (value === null || typeof value === "undefined") { return null; }

  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

const remainingAgentLimit = (limit: unknown, used: number): AgentLimit => {
  const normalized = normalizeAgentLimit(limit);
  if (normalized === null) { return null; }

  return Math.max(0, normalized - Math.max(0, used || 0));
};

export { normalizeAgentLimit, remainingAgentLimit };
export type { AgentLimit };
