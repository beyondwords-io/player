import { Connector } from "./index";

// Only the classic script registers a global. ESM consumers get side-effect-free
// imports, and loading either embed first preserves the other BeyondWords APIs.
if (typeof window !== "undefined") {
  const scope = window as typeof window & { BeyondWords?: Record<string, unknown> };
  scope.BeyondWords ||= {};
  scope.BeyondWords.Connector ||= Connector;
}
