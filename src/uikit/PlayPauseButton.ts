import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import { PlayerProvider } from "./PlayerProvider";

class PlayPauseButton extends globalThis.HTMLElement {
  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          cursor: pointer;
        }

        :host([data-state="playing"]) slot[name=play],
        :host([data-state="paused"]) slot[name=pause] {
          display: none !important;
        }
      </style>
      <slot name="icon">
        <slot name="play">▶️</slot>
        <slot name="pause">⏸️</slot>
      </slot>
    `;
    this.setAttribute("role", "button");
  }

  connectedCallback() {
    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.player.addEventListener("PlaybackPlaying", this.#updateAttributes);
    this.player.addEventListener("PlaybackPaused", this.#updateAttributes);
    this.#updateAttributes();
    this.tabIndex = 0;
    this.addEventListener("click", this.#clickListener);
  }

  disconnectedCallback() {
    this.player?.removeEventListener("PlaybackPlaying", this.#updateAttributes);
    this.player?.removeEventListener("PlaybackPaused", this.#updateAttributes);
    this.player = null;
    this.#updateAttributes();
    this.tabIndex = -1;
    this.removeEventListener("click", this.#clickListener);
  }

  #updateAttributes = () => {
    this.setAttribute(
      "data-state",
      this.player?.playbackState === "playing" ? "playing" : "paused",
    );
    this.setAttribute(
      "aria-label",
      this.player?.playbackState === "playing" ? "Pause audio" : "Play audio",
    );
  };

  #clickListener = (event: PointerEvent) => {
    event.preventDefault();
    const name = this.player?.playbackState === "playing" ? "Pause" : "Play";
    this.player?.controller.processEvent(
      newEvent({
        type: `Pressed${name}`,
        description: `The ${name.toLowerCase()} button was pressed.`,
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };
}

if (!globalThis.customElements.get("beyondwords-play-pause-button")) {
  globalThis.customElements.define(
    "beyondwords-play-pause-button",
    PlayPauseButton,
  );
}

export { PlayPauseButton };

export default PlayPauseButton;
