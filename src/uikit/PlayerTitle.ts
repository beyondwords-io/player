import { Player } from "../Player";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

class PlayerTitle extends globalThis.HTMLElement {
  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
            font-size: 12px;
            font-weight: 500;
            line-height: 1.25;

            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
      </style>
      <slot id="value" name="value"></slot>
    `;
  }

  connectedCallback() {
    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayerTitle must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.player?.addEventListener("RootStateChange", this.#updateAttributes);
    this.player?.headlessAPI?.handleStateChange();
  }

  disconnectedCallback() {
    this.player?.removeEventListener("RootStateChange", this.#updateAttributes);
    this.player = null;
    this.#updateAttributes(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateAttributes = (event: any) => {
    const titleElement = this.shadowRoot?.querySelector("#value");
    titleElement!.textContent =
      event?.state?.callToAction || translate("listenToThisArticle");
  };
}

if (!globalThis.customElements.get("beyondwords-player-title")) {
  globalThis.customElements.define("beyondwords-player-title", PlayerTitle);
}

export { PlayerTitle };

export default PlayerTitle;
