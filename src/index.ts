import PlayerComponent from "./components/Player.svelte";
import RootController from "./controllers/rootController";
import setErrorHandler from "./helpers/setErrorHandler";
import validateWebContext from "./helpers/validateWebContext";
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
    listenToSegments();

    const { newTarget, showUserInterface } = resolveTarget(target);

    newTarget.classList.add("beyondwords-player", "bwp");
    if (!Player._styleLoaded) { newTarget.style.display = "none"; }

    const controller = new RootController(null, Player);
    controller.addEventListener("<any>", e => sendToAnalytics(this, e));

    const initialProps = { showUserInterface, ...props };
    super({ target: newTarget, props: { controller, ...initialProps, initialProps } });

    controller.player = this;
    Player.#instances.push(this);
  }

  static styleLoaded() {
    Player.instances().forEach(p => p.target.style.removeProperty("display"));
    Player._styleLoaded = true;
  }

  static get version() {
    return version;
  }

  static get styleSrc() {
    return `https://proxy.beyondwords.io/npm/@beyondwords/player@${version}/dist/style.js`;
  }

  static get hlsSrc() {
    return `https://proxy.beyondwords.io/npm/@beyondwords/player@${version}/dist/hls.light.min.js`;
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
}

if (typeof window !== "undefined") {
  window.BeyondWords ||= {};
  window.BeyondWords.Player ||= Player;
}

export default { Player };
