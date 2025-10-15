import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

class ProgressBar extends globalThis.HTMLElement {
  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: relative;
          display: inline-flex;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          outline-offset: 3.2px;
          cursor: pointer;
        }

        .bw-background {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: var(--active-icon-color);
          opacity: 0.15;
          cursor: pointer;
        }

        :host[data-readonly], :host[data-readonly] * {
          cursor: auto;
        }

        .bw-progress {
            height: 8px;
            border-radius: 4px;
            pointer-events: none;
            background: var(--active-icon-color);
            width: var(--progress, 0);
        }
      </style>
      <slot name="background">
        <div class="bw-background"></div>
      </slot>
      <slot name="progress">
        <div class="bw-progress"></div>
      </slot>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute("role", "slider");
    this.setAttribute("aria-label", translate("playbackTime"));

    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.player = playerProvider.player!;
    this.player?.addEventListener("RootStateChange", this.#updateAttributes);
    this.player?.headlessAPI?.handleStateChange();
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("mouseup", blurElement);
  }

  disconnectedCallback() {
    this.player?.removeEventListener("RootStateChange", this.#updateAttributes);
    this.player = null;
    this.#updateAttributes(null);
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("mouseup", blurElement);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateAttributes = (event: any) => {
    const readonly = event?.state?.isAdvert ?? false;
    const progress = event?.state?.progress ?? 0;
    // const duration = event?.state?.duration ?? 0;
    if (readonly) this.setAttribute("data-readonly", "");
    else this.removeAttribute("data-readonly");
    this.style.setProperty("--progress", `${progress * 100}%`);
  };

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

if (!globalThis.customElements.get("beyondwords-progress-bar")) {
  globalThis.customElements.define("beyondwords-progress-bar", ProgressBar);
}

export { ProgressBar };

export default ProgressBar;
