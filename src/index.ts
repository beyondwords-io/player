import { Player } from "./Player";
import newEvent from "./helpers/newEvent";

if (typeof window !== "undefined") {
  window.BeyondWords ||= {};
  window.BeyondWords.Player ||= Player;
  window.BeyondWords.newEvent ||= newEvent;
}

export * from "./uikit";
export * from "./Player";

export default { Player };
