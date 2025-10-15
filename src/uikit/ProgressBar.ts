import { Player } from "../Player";
import newEvent from "../helpers/newEvent";
import blurElement from "../helpers/blurElement";
import translate from "../helpers/translate";
import { PlayerProvider } from "./PlayerProvider";

const formatUnit = (n: number, units: string) => {
  if (n === 0) return;
  const key = n === 1 ? `${units}Singular` : `${units}Plural`;
  return translate(key).replace("{n}", n);
};

const formatTime = (n: number) => {
  const rounded = Math.floor(n);

  if (rounded === 0) return translate("secondsPlural").replace("{n}", 0);

  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  return [formatUnit(minutes, "minutes"), formatUnit(seconds, "seconds")]
    .filter((s) => s)
    .join(" ");
};

class ProgressBar extends globalThis.HTMLElement {
  #mouseDown = false;
  #prevDuration: number | null = null;
  #readFullTime = true;
  #player: Player | null = null;

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

        :host([data-readonly]), :host([data-readonly]) * {
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
    this.setAttribute("aria-valuemin", "0");
    const playerProvider = this.closest("beyondwords-player-provider");
    if (!(playerProvider instanceof PlayerProvider)) {
      console.error("PlayPauseButton must be used within a PlayerProvider");
      return;
    }
    this.#player = playerProvider.player!;
    this.#player?.addEventListener("RootStateChange", this.#updateAttributes);
    this.#player?.headlessAPI?.handleStateChange();
    this.addEventListener("mousedown", this.#handleMouseDown);
    this.addEventListener("touchstart", this.#handleMouseDown);
    this.addEventListener("keydown", this.#handleKeyDown);
    this.addEventListener("mouseup", blurElement);
    this.addEventListener("focus", this.#handleFocus);
    window.addEventListener("mouseup", this.#handleMouseUp);
    window.addEventListener("mousemove", this.#handleMouseMove);
    window.addEventListener("touchend", this.#handleMouseUp);
    window.addEventListener("touchmove", this.#handleMouseMove);
  }

  disconnectedCallback() {
    this.#player?.removeEventListener(
      "RootStateChange",
      this.#updateAttributes,
    );
    this.#player = null;
    this.#mouseDown = false;
    this.#prevDuration = null;
    this.#readFullTime = true;
    this.tabIndex = -1;
    this.removeAttribute("role");
    this.removeAttribute("data-readonly");
    this.removeAttribute("aria-label");
    this.removeAttribute("aria-valuemin");
    this.removeAttribute("aria-valuemax");
    this.removeAttribute("aria-valuenow");
    this.removeAttribute("aria-valuetext");
    this.style.removeProperty("--progress");
    this.removeEventListener("mousedown", this.#handleMouseDown);
    this.removeEventListener("touchstart", this.#handleMouseDown);
    this.removeEventListener("keydown", this.#handleKeyDown);
    this.removeEventListener("mouseup", blurElement);
    this.removeEventListener("focus", this.#handleFocus);
    window.removeEventListener("mouseup", this.#handleMouseUp);
    window.removeEventListener("mousemove", this.#handleMouseMove);
    window.removeEventListener("touchend", this.#handleMouseUp);
    window.removeEventListener("touchmove", this.#handleMouseMove);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateAttributes = (event: any) => {
    const readonly = event?.state?.isAdvert ?? false;
    const progress = event?.state?.progress ?? 0;
    const duration = event?.state?.duration ?? 0;
    if (this.#prevDuration !== duration) this.#updateAriaValue();
    this.#prevDuration = duration;
    if (readonly) {
      this.setAttribute("data-readonly", "");
    } else {
      this.removeAttribute("data-readonly");
    }
    this.style.setProperty("--progress", `${progress * 100}%`);
  };

  #updateAriaValue = () => {
    const currentTime = this.#player?.headlessAPI?.currentTime ?? 0;
    const duration = this.#player?.headlessAPI?.duration ?? 0;
    const outOf = this.#readFullTime
      ? ` ${translate("outOfTotalTime")} ${formatTime(duration)}`
      : "";
    this.setAttribute("aria-valuemax", Math.floor(duration).toString());
    this.setAttribute("aria-valuenow", currentTime.toString());
    this.setAttribute("aria-valuetext", `${formatTime(currentTime)}${outOf}`);
  };

  #handleFocus = () => {
    this.#readFullTime = true;
    this.#updateAriaValue();
  };

  #handleKeyDown = (event: KeyboardEvent) => {
    let key;

    if (event.key === "ArrowLeft") key = "Left";
    if (event.key === "ArrowRight") key = "Right";
    if (event.key === " ") key = "Space";
    if (event.key === "Enter") key = "Enter";

    if (!key) return;
    event.preventDefault();

    this.#player?.controller.processEvent(
      newEvent({
        type: `Pressed${key}OnProgressBar`,
        description: `The ${key.toLowerCase()} key was pressed while the progress bar was focussed.`,
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );

    if (key === "Left" || key === "Right") this.#handleLeftOrRight();
  };

  #handleMouseDown = (event: MouseEvent | TouchEvent) => {
    this.#mouseDown = true;
    this.#player?.controller.processEvent(
      newEvent({
        type: "PressedProgressBar",
        description: "The progress bar was pressed at some ratio.",
        initiatedBy: "user",
        ratio: this.#getMouseRatio(event),
        emittedFrom: "inline-player",
      }),
    );
  };

  #handleMouseMove = (event: MouseEvent | TouchEvent) => {
    if (!this.#mouseDown) return;
    this.#player?.controller.processEvent(
      newEvent({
        type: "ScrubbedProgressBar",
        description: "The user pressed on the progress bar then dragged.",
        initiatedBy: "user",
        ratio: this.#getMouseRatio(event),
        emittedFrom: "inline-player",
      }),
    );
  };

  #handleMouseUp = () => {
    if (!this.#mouseDown) return;
    this.#mouseDown = false;

    this.#player?.controller.processEvent(
      newEvent({
        type: "FinishedScrubbingProgressBar",
        description: "The user let go after scrubbing the progress bar.",
        initiatedBy: "user",
        emittedFrom: "inline-player",
      }),
    );
  };

  #handleLeftOrRight = () => {
    this.#readFullTime = false;
    this.#updateAriaValue();
  };

  #getMouseRatio = (event: MouseEvent | TouchEvent) => {
    const clientX =
      "clientX" in event ? event.clientX : event.touches?.[0]?.clientX || 0;

    const { x, width } = this.getBoundingClientRect();
    const mouseRatio = (clientX - x) / width;

    return Math.max(0, Math.min(1, mouseRatio));
  };
}

if (!globalThis.customElements.get("beyondwords-progress-bar")) {
  globalThis.customElements.define("beyondwords-progress-bar", ProgressBar);
}

export { ProgressBar };

export default ProgressBar;
