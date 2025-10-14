import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

class PlaybackRateButton extends globalThis.HTMLElement {
  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: var(--active-text-color);
          cursor: pointer;
        }

        @media (hover: hover) and (pointer: fine) {
          :host(:hover) {
            opacity: 0.7;
          }
        }
      </style>
      <slot id="value" name="value"></slot>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute("role", "spinbutton");
    this.setAttribute("type", "button");
    this.setAttribute("aria-label", translate("changePlaybackRate"));

    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.player?.addEventListener("RootStateChange", this.#updateAttributes);
    this.player?.headlessAPI?.handleStateChange();
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("keydown", this.#handleKeyDown);
    this.addEventListener("mouseup", blurElement);
  }

  disconnectedCallback() {
    this.player?.removeEventListener("RootStateChange", this.#updateAttributes);
    this.player = null;
    this.#updateAttributes(null);
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("keydown", this.#handleKeyDown);
    this.removeEventListener("mouseup", blurElement);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateAttributes = (event: any) => {
    const rate = event?.state?.playbackRate ?? 1;
    const rates = event?.state?.playbackRates ?? [];
    const minRate = rates.length === 0 ? 0 : Math.min(...rates);
    const maxRate = rates.length === 0 ? 1 : Math.max(...rates);
    const valueElement = this.shadowRoot?.querySelector("#value");
    this.setAttribute("data-value", rate.toString());
    this.setAttribute("aria-valuetext", `${rate}x`);
    this.setAttribute("aria-valuenow", rate.toString());
    this.setAttribute("aria-valuemin", minRate.toString());
    this.setAttribute("aria-valuemax", maxRate.toString());
    if (valueElement) {
      valueElement.textContent = `${rate}x`;
    }
  };

  #handleClick = (event: PointerEvent) => {
    event.preventDefault();
    this.player?.controller.processEvent(
      newEvent({
        type: "PressedChangeRate",
        description: "The change playback rate button was pressed.",
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };

  #handleKeyDown = (event: KeyboardEvent) => {
    let key;

    if (event.key === "ArrowLeft") {
      key = "Left";
    }
    if (event.key === "ArrowRight") {
      key = "Right";
    }
    if (event.key === "ArrowDown") {
      key = "Down";
    }
    if (event.key === "ArrowUp") {
      key = "Up";
    }
    if (event.key === " ") {
      key = "Space";
    }
    if (event.key === "Enter") {
      key = "Enter";
    }

    if (!key) {
      return;
    }
    event.preventDefault();

    this.player?.controller.processEvent(
      newEvent({
        type: `Pressed${key}OnChangeRate`,
        description: `The ${key.toLowerCase()} key was pressed while change playback rate was focussed.`,
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };
}

if (!globalThis.customElements.get("beyondwords-playback-rate-button")) {
  globalThis.customElements.define(
    "beyondwords-playback-rate-button",
    PlaybackRateButton,
  );
}

export { PlaybackRateButton };

export default PlaybackRateButton;
