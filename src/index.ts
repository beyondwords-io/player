import PlayerComponent from "./components/Player.svelte";
import RootController from "./controllers/rootController";
import setErrorHandler from "./helpers/setErrorHandler";
import validateWebContext from "./helpers/validateWebContext";
import initializeSentry from "./helpers/initializeSentry";
import listenToSegments from "./helpers/listenToSegments";
import resolveTarget from "./helpers/resolveTarget";
import sendToAnalytics from "./helpers/sendToAnalytics";
import throwError from "./helpers/throwError";
import { version } from "../package.json";

class Player extends PlayerComponent {
  static #instances = [];

  constructor({ target, ...props }) {
    validateWebContext();
    setErrorHandler(props);
    initializeSentry(props);
    listenToSegments();

    const { newTarget, showUserInterface } = resolveTarget(target);
    newTarget.classList.add("beyondwords-player", "bwp");

    const controller = new RootController(null, Player);
    controller.addEventListener("<any>", e => sendToAnalytics(this, e));

    const initialProps = { showUserInterface, ...props };
    super({ target: newTarget, props: { controller, ...initialProps, initialProps } });

    controller.player = this;
    Player.#instances.push(this);
  }

  static get version() {
    return version;
  }

  static instances() {
    return [...Player.#instances];
  }

  static destroyAll() {
    Player.#instances.forEach(p => p.destroy());
  }

  destroy() {
    this.$destroy();
    Player.#instances = Player.#instances.filter(p => p !== this);
  }

  get target() {
    return this.$$.root;
  }

  set target(target) {
    throwError([
      "Unable to change the player's target after initialization.",
      "Call player.destroy() and initialize a new player, instead.",
      "",
      "Alternatively, you can show or hide the player with:",
      "player.showUserInterface = <bool>",
    ]);
  }
}

if (typeof window !== "undefined") {
  window.BeyondWords ||= {};
  window.BeyondWords.Player ||= Player;
}

export default { Player };
