import { Player } from "./Player";

if (typeof window !== "undefined") {
  window.BeyondWords ||= {};
  window.BeyondWords.Player ||= Player;
}

export * from "./uikit";
export * from "./Player";

export default { Player };
