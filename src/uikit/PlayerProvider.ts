import { Player } from "../Player";

class PlayerProvider extends globalThis.HTMLElement {
  static get observedAttributes() {
    return ["project-id", "content-id"];
  }

  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        #target {
          display: none;
        }
      </style>
      <div id="target"></div>
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.player = new Player({
      target: this.shadowRoot?.querySelector("#target"),
      showUserInterface: false,
      projectId: this.projectId ?? undefined,
      contentId: this.contentId ?? undefined,
    });
    this.player?.addEventListener(
      "RootStateChange",
      this.#updateAttributes,
    );
    this.player?.headlessAPI?.handleStateChange();
  }

  disconnectedCallback() {
    this.player?.removeEventListener(
      "RootStateChange",
      this.#updateAttributes,
    );
    this.player?.destroy();
    this.player = null;
    this.#updateAttributes(null);
  }

  async attributeChangedCallback(
    attrName: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (!this.player || newValue === oldValue) return;
    switch (attrName) {
    case "project-id":
      this.player.projectId = newValue;
      break;
    case "content-id":
      this.player.contentId = newValue;
      break;
    }
  }

  get projectId() {
    return this.getAttribute("project-id");
  }

  set projectId(value: string | null) {
    if (this.projectId === value) return;
    if (value === null) {
      this.removeAttribute("project-id");
    } else {
      this.setAttribute("project-id", value);
    }
  }

  get contentId() {
    return this.getAttribute("content-id");
  }

  set contentId(value: string | null) {
    if (this.contentId === value) return;
    if (value === null) {
      this.removeAttribute("content-id");
    } else {
      this.setAttribute("content-id", value);
    }
  }

  #updateAttributes = (event: any) => {
    this.style.setProperty("--background-color", event?.state?.backgroundColor ?? "#f5f5f5");
    this.style.setProperty("--active-bg-color", event?.state?.activeBgColor ?? "#f5f5f5");
    this.style.setProperty("--active-text-color", event?.state?.activeTextColor ?? "#111");
    this.style.setProperty("--active-icon-color", event?.state?.activeIconColor ?? "#323232");
  };
}

if (!globalThis.customElements.get("beyondwords-player-provider")) {
  globalThis.customElements.define(
    "beyondwords-player-provider",
    PlayerProvider,
  );
}

export { PlayerProvider };

export default PlayerProvider;
