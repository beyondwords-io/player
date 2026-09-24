import { PLAYER_COLOR_PRESETS } from "../helpers/default_theme/palettes";
import { subscribeMediaQuery } from "../helpers/mediaQuery";
import { createConnectorIcon } from "./icons";
import styles from "./widget.css?inline";

export type ConnectorProvider = "claude" | "chatgpt";
export type ConnectorTheme = "light" | "dark" | "auto";

export interface ConnectorWidgetOptions {
  /** The element (or selector) to append the widget to. Existing content is kept. */
  target: HTMLElement | string;
  /** A complete HTTP(S) connection-page URL. Provider selection never changes it. */
  connectUrl: string;
  /** Omit for the generic “Add to AI assistant” widget. Branding only. */
  provider?: ConnectorProvider;
  label?: string;
  /** Defaults to auto, following live system color-scheme changes. */
  theme?: ConnectorTheme;
}

type Configuration = Omit<ConnectorWidgetOptions, "target">;

export interface ConnectorWidget {
  element: HTMLElement;
  update: (options: Partial<Configuration>) => void;
  destroy: () => void;
}

const validate = (options: Configuration): Configuration => {
  if (options.provider !== undefined && !["claude", "chatgpt"].includes(options.provider)) {
    throw new Error("Unknown connector provider.");
  }
  if (options.theme !== undefined && !["light", "dark", "auto"].includes(options.theme)) {
    throw new Error("Connector theme must be light, dark, or auto.");
  }
  if (options.label !== undefined && typeof options.label !== "string") {
    throw new Error("Connector label must be a string.");
  }

  let url: URL;
  try {
    url = new URL(options.connectUrl);
  } catch {
    throw new Error("connectUrl must be a complete HTTP(S) URL.");
  }
  if (!/^https?:\/\//i.test(options.connectUrl) || !["https:", "http:"].includes(url.protocol)) {
    throw new Error("connectUrl must be a complete HTTP(S) URL.");
  }
  return { ...options };
};

const defaultLabel = (provider?: ConnectorProvider): string => {
  if (provider === "claude") { return "Add to Claude"; }
  if (provider === "chatgpt") { return "Add to ChatGPT"; }
  return "Add to AI assistant";
};

/** Mount a standalone widget without loading the player or changing global state. */
export const createConnectorWidget = (options: ConnectorWidgetOptions): ConnectorWidget => {
  const target = typeof options.target === "string" ? document.querySelector(options.target) : options.target;
  if (!target || target.nodeType !== 1 || target.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    throw new Error("Connector target must resolve to an HTML element.");
  }

  let configuration = validate({
    connectUrl: options.connectUrl,
    provider: options.provider,
    label: options.label,
    theme: options.theme,
  });
  let destroyed = false;
  let unsubscribe = () => {};

  const ownerDocument = target.ownerDocument;
  const element = ownerDocument.createElement("span");
  element.setAttribute("data-connector-widget", "");
  const root = element.attachShadow({ mode: "open" });
  const style = ownerDocument.createElement("style");
  style.textContent = styles;
  const link = ownerDocument.createElement("a");
  const label = ownerDocument.createElement("span");
  label.className = "label";
  root.append(style, link);

  const render = () => {
    // Set user-supplied content as text/attributes, never HTML. Keep the URL verbatim.
    label.textContent = configuration.label?.trim() ? configuration.label : defaultLabel(configuration.provider);
    link.setAttribute("href", configuration.connectUrl);
    link.replaceChildren(createConnectorIcon(ownerDocument, configuration.provider), label);
  };

  const applyTheme = (dark: boolean) => {
    const theme = dark ? "dark" : "light";
    const palette = PLAYER_COLOR_PRESETS[theme];
    link.dataset.theme = theme;
    link.style.setProperty("--connector-background", palette.backgroundColor);
    link.style.setProperty("--connector-text", palette.textColor);
  };

  const listenForTheme = () => {
    unsubscribe();
    unsubscribe = () => {};
    if (!configuration.theme || configuration.theme === "auto") {
      const view = ownerDocument.defaultView;
      unsubscribe = subscribeMediaQuery("(prefers-color-scheme: dark)", applyTheme, view?.matchMedia?.bind(view));
    } else {
      applyTheme(configuration.theme === "dark");
    }
  };

  render();
  listenForTheme();
  target.appendChild(element);

  return {
    element,
    update: (updates) => {
      if (destroyed) { throw new Error("Cannot update a destroyed connector widget."); }
      const next = validate({ ...configuration, ...updates });
      const themeChanged = next.theme !== configuration.theme;
      configuration = next;
      render();
      if (themeChanged) { listenForTheme(); }
    },
    destroy: () => {
      if (destroyed) { return; }
      destroyed = true;
      unsubscribe();
      element.remove();
    },
  };
};

/** Script-embed API: `new BeyondWords.Connector(options)`. */
export class Connector implements ConnectorWidget {
  readonly element: ConnectorWidget["element"];
  readonly update: ConnectorWidget["update"];
  readonly destroy: ConnectorWidget["destroy"];

  constructor(options: ConnectorWidgetOptions) {
    const widget = createConnectorWidget(options);
    this.element = widget.element;
    this.update = widget.update;
    this.destroy = widget.destroy;
  }
}
