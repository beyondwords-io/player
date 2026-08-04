import PlayerComponent from "./components/Player.svelte";
import RootController from "./controllers/rootController";
import setErrorHandler from "./helpers/setErrorHandler";
import validateWebContext from "./helpers/validateWebContext";
import listenToSegments from "./helpers/listenToSegments";
import resolveTarget from "./helpers/resolveTarget";
import sendToAnalytics from "./helpers/sendToAnalytics";
import renameProp from "./helpers/renameProp";
import propertyValues from "./helpers/propertyValues";
import playerPropsToIgnore from "./helpers/playerPropsToIgnore";
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

    renameProp("xdv3rts", "adverts", props);
    renameProp("xdv3rtIndex", "advertIndex", props);
    renameProp("loadContentAs", "summary", props, value => value?.[0] === "summary");
    const initialVideo = props.video;
    const playerStyleWasProvided = typeof props.playerStyle !== "undefined";

    // For an explicitly selected default style, video stays a boolean prop.
    // Otherwise retain the legacy alias while the API decides whether this is
    // actually a default-style project.
    if (props.playerStyle !== "default") {
      renameProp("video", "playerStyle", props, bool => bool ? "video" : props.playerStyle);
    }

    const initialProps = { showUserInterface, ...props };
    let componentProps = initialProps;

    if (initialVideo && !playerStyleWasProvided) {
      const aliasedPlayerStyle = initialProps.playerStyle;

      // The alias chooses the initial request and remains the legacy fallback,
      // but it is not an explicit playerStyle override: `/player` may reveal
      // that `video` is the default style's boolean setting instead.
      delete initialProps.playerStyle;
      initialProps.video = initialVideo;
      componentProps = {
        ...initialProps,
        playerStyle: aliasedPlayerStyle,
        videoPlayerStyleAlias: aliasedPlayerStyle,
      };
    }

    super({ target: newTarget, props: { controller, ...componentProps, initialProps } });

    Object.defineProperty(this, "accessTier", {
      get: () => this.getAccessTier?.(),
      set: (value) => this.setAccessTier?.(value),
      enumerable: false,
      configurable: true,
    });

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

  properties() {
    return propertyValues(this, playerPropsToIgnore);
  }
}

if (typeof window !== "undefined") {
  window.BeyondWords ||= {};
  window.BeyondWords.Player ||= Player;
}

export default { Player };
