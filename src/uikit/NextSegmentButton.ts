import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

class NextSegmentButton extends globalThis.HTMLElement {
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

        .bw-icon {
            width: 40px;
            height: 40px;
            fill: var(--active-icon-color);
        }

        .bw-icon path {
            fill: var(--active-icon-color);
        }

        @media (hover: hover) and (pointer: fine) {
          :host(:hover) {
            opacity: 0.8;
          }
        }
      </style>
      <slot name="icon">
        <svg class="bw-icon" viewBox="-12 -12 35 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.75 4.70093C10.75 5.27828 10.75 6.72166 9.75 7.29901L2.25 11.6291C1.25 12.2065 0 11.4848 0 10.3301V1.66984C0 0.515139 1.25 -0.206548 2.25 0.370802L9.75 4.70093Z" />
        </svg>
      </slot>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute("role", "button");
    this.setAttribute("aria-label", translate("nextSegment"));

    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("mouseup", blurElement);
  }

  disconnectedCallback() {
    this.player = null;
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("mouseup", blurElement);
  }

  #handleClick = (event: PointerEvent) => {
    event.preventDefault();
    this.player?.controller.processEvent(
      newEvent({
        type: "PressedNextSegment",
        description: "The next segment button was pressed.",
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };
}

if (!globalThis.customElements.get("beyondwords-next-segment-button")) {
  globalThis.customElements.define(
    "beyondwords-next-segment-button",
    NextSegmentButton,
  );
}

export { NextSegmentButton };

export default NextSegmentButton;
