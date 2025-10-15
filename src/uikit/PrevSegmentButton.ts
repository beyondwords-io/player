import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

class PrevSegmentButton extends globalThis.HTMLElement {
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

        .default-icon {
            width: 40px;
            height: 40px;
            fill: var(--active-icon-color);
        }

        .default-icon path {
            fill: var(--active-icon-color);
        }

        @media (hover: hover) and (pointer: fine) {
          :host(:hover) {
            opacity: 0.8;
          }
        }
      </style>
      <slot name="icon">
        <svg class="default-icon" viewBox="-12 -12 35 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.25 7.29901C0.249999 6.72166 0.250001 5.27828 1.25 4.70093L8.75 0.370802C9.75 -0.206548 11 0.51514 11 1.66984V10.3301C11 11.4848 9.75 12.2065 8.75 11.6291L1.25 7.29901Z" />
        </svg>
      </slot>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute("role", "button");
    this.setAttribute("aria-label", translate("previousSegment"));

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
        type: "PressedPrevSegment",
        description: "The previous segment button was pressed.",
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };
}

if (!globalThis.customElements.get("beyondwords-prev-segment-button")) {
  globalThis.customElements.define(
    "beyondwords-prev-segment-button",
    PrevSegmentButton,
  );
}

export { PrevSegmentButton };

export default PrevSegmentButton;
