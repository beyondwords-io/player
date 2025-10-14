import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import { PlayerProvider } from "./PlayerProvider";

class PlayPauseButton extends globalThis.HTMLElement {
  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          cursor: pointer;
        }

        @media (hover: hover) and (pointer: fine) {
          :host(:hover) {
            opacity: 0.8;
          }
        }

        :host([data-state="playing"]) slot[name=play],
        :host([data-state="paused"]) slot[name=pause] {
          display: none !important;
        }
      </style>
      <slot name="icon">
        <slot name="play">
          <svg width="40" height="40" viewBox="0.6667 0.6667 26.6667 26.6667" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path style="fill: var(--icon-color);" d="M14 0.666748C6.63996 0.666748 0.666626 6.64008 0.666626 14.0001C0.666626 21.3601 6.63996 27.3334 14 27.3334C21.36 27.3334 27.3333 21.3601 27.3333 14.0001C27.3333 6.64008 21.36 0.666748 14 0.666748ZM11.3333 18.6667V9.33341C11.3333 8.78675 11.96 8.46675 12.4 8.80008L18.6266 13.4667C18.9866 13.7334 18.9866 14.2667 18.6266 14.5334L12.4 19.2001C11.96 19.5334 11.3333 19.2134 11.3333 18.6667Z" />
          </svg>
        </slot>
        <slot name="pause">
          <svg width="40" height="40" viewBox="0.6667 0.6667 26.6667 26.6667" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path style="fill: var(--icon-color);" d="M14 0.666748C6.63996 0.666748 0.666626 6.64008 0.666626 14.0001C0.666626 21.3601 6.63996 27.3334 14 27.3334C21.36 27.3334 27.3333 21.3601 27.3333 14.0001C27.3333 6.64008 21.36 0.666748 14 0.666748ZM11.3333 19.3334C10.6 19.3334 9.99996 18.7334 9.99996 18.0001V10.0001C9.99996 9.26675 10.6 8.66675 11.3333 8.66675C12.0666 8.66675 12.6666 9.26675 12.6666 10.0001V18.0001C12.6666 18.7334 12.0666 19.3334 11.3333 19.3334ZM16.6666 19.3334C15.9333 19.3334 15.3333 18.7334 15.3333 18.0001V10.0001C15.3333 9.26675 15.9333 8.66675 16.6666 8.66675C17.4 8.66675 18 9.26675 18 10.0001V18.0001C18 18.7334 17.4 19.3334 16.6666 19.3334Z" />
          </svg>
        </slot>
      </slot>
    `;
  }

  connectedCallback() {
    this.setAttribute("role", "button");

    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.player?.addEventListener(
      "PlayPauseButtonStateChange",
      this.#updateAttributes,
    );
    this.player?.headlessAPI?.playPauseButton?.handleStateChange();
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("mouseup", blurElement);
  }

  disconnectedCallback() {
    this.player?.removeEventListener(
      "PlayPauseButtonStateChange",
      this.#updateAttributes,
    );
    this.player = null;
    this.#updateAttributes(null);
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("mouseup", blurElement);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateAttributes = (event: any) => {
    this.tabIndex = event?.state?.tabindex ?? 0;
    this.style.setProperty("--icon-color", event?.state?.color ?? "#323232");
    this.setAttribute(
      "data-state",
      event?.state?.isPlaying ? "playing" : "paused",
    );
    event?.state?.ariaLabel
      ? this.setAttribute("aria-label", event.state.ariaLabel)
      : this.removeAttribute("aria-label");
  };

  #handleClick = (event: PointerEvent) => {
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
