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
export type {
  PlayerColorTheme,
  PlayerThemeName,
  PlayerThemePreference,
  VideoColorTheme,
} from "./helpers/default_theme/palettes";

const propertyDescriptor = (object, key) => {
  let prototype = Object.getPrototypeOf(object);
  while (prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (descriptor) { return descriptor; }
    prototype = Object.getPrototypeOf(prototype);
  }
};

// Svelte accessors react to whole-object assignment. Wrap the three public
// palette objects so `player.lightTheme.textColor = ...` is equally reactive,
// which is the natural script API shape for changing one colour at runtime.
const makeObjectMutationsReactive = (player, key, resolvedKey) => {
  const descriptor = propertyDescriptor(player, key);
  const resolvedDescriptor = propertyDescriptor(player, resolvedKey);
  if (!descriptor?.get || !descriptor?.set || !resolvedDescriptor?.get) { return; }

  const proxies = new WeakMap();
  const proxyFor = (value) => {
    if (!value || typeof value !== "object") { return value; }
    if (proxies.has(value)) { return proxies.get(value); }

    const proxy = new Proxy(value, {
      set(_target, property, nextValue) {
        const overrides = descriptor.get.call(player) || {};
        descriptor.set.call(player, { ...overrides, [property]: nextValue });
        return true;
      },
      deleteProperty(_target, property) {
        const next = { ...(descriptor.get.call(player) || {}) };
        delete next[property];
        descriptor.set.call(player, next);
        return true;
      },
    });
    proxies.set(value, proxy);
    return proxy;
  };

  Object.defineProperty(player, key, {
    get: () => proxyFor(resolvedDescriptor.get.call(player)),
    set: (value) => descriptor.set.call(player, value ?? {}),
    enumerable: true,
    configurable: true,
  });
};

const exposeResolvedTheme = (player) => {
  const overrideDescriptor = propertyDescriptor(player, "theme");
  const resolvedDescriptor = propertyDescriptor(player, "resolvedThemePreference");
  if (!overrideDescriptor?.set || !resolvedDescriptor?.get) { return; }

  Object.defineProperty(player, "theme", {
    get: () => resolvedDescriptor.get.call(player),
    set: (value) => overrideDescriptor.set.call(player, value),
    enumerable: true,
    configurable: true,
  });
};

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

    makeObjectMutationsReactive(this, "lightTheme", "resolvedLightTheme");
    makeObjectMutationsReactive(this, "darkTheme", "resolvedDarkTheme");
    makeObjectMutationsReactive(this, "videoTheme", "resolvedVideoTheme");
    exposeResolvedTheme(this);

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

  static get agentSrc() {
    return `https://proxy.beyondwords.io/npm/@beyondwords/player@${version}/dist/elevenlabs-client.js`;
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
