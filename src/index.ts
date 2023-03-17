import "./helpers/initializeSentry";
import PlayerComponent from "./components/Player.svelte";
import RootController from "./controllers/rootController";
import resolveTarget from "./helpers/resolveTarget";
import sendToAnalytics from "./helpers/sendToAnalytics";
import throwError from "./helpers/throwError";

class Player extends PlayerComponent {
  static #instances = [];

  constructor({ target, ...props }) {
    const { newTarget, showUserInterface } = resolveTarget(target);
    newTarget.classList.add("beyondwords-player");

    const initialProps = { showUserInterface, ...props };
    super({ target: newTarget, props: { ...initialProps, initialProps } });

    const controller = new RootController(this, Player);
    controller.addEventListener("<any>", e => sendToAnalytics(this, e));

    this.controller = controller;
    Player.#instances.push(this);
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

const BeyondWords = { Player };

if (typeof window !== "undefined") {
  window.BeyondWords = BeyondWords;
}

export default BeyondWords;
