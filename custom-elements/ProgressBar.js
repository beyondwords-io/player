class ProgressBar extends globalThis.HTMLElement {
  #instance = null;
  #listenerHandle = null;
  #rootElement = null;
  #prevDuration = null;
  #mouseDown = false;
  #readFullTime = true;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <slot name="root">
        <div tabindex="0" role="slider" aria-valuemin="0" part="root">
          <slot></slot>
        </div>
      </slot>
    `;
  }

  connectedCallback() {
    const playerElement = this.closest("beyondwords-player");
    if (!(playerElement instanceof HTMLElement)) {
      console.error(
        "beyondwords-progress-bar must be used within a beyondwords-player",
      );
      return;
    }
    if (!playerElement.instance) {
      console.error(
        "beyondwords-progress-bar created with uninitialized beyondwords-player",
      );
      return;
    }

    this.#instance = playerElement.instance;
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateDOM,
    );

    this.#rootElement = this.shadowRoot.querySelector("div[part='root']");

    this.#rootElement?.addEventListener("mousedown", this.#handleMouseDown);
    this.#rootElement?.addEventListener("touchstart", this.#handleMouseDown);
    this.#rootElement?.addEventListener("keydown", this.#handleKeyDown);
    this.#rootElement?.addEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );
    this.#rootElement?.addEventListener("focus", this.#handleFocus);

    window.addEventListener("mouseup", this.#handleMouseUp);
    window.addEventListener("mousemove", this.#handleMouseMove);
    window.addEventListener("touchend", this.#handleMouseUp);
    window.addEventListener("touchmove", this.#handleMouseMove);

    this.#updateDOM();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#instance = null;
    this.#listenerHandle = null;

    this.#rootElement?.removeEventListener("mousedown", this.#handleMouseDown);
    this.#rootElement?.removeEventListener("touchstart", this.#handleMouseDown);
    this.#rootElement?.removeEventListener("keydown", this.#handleKeyDown);
    this.#rootElement?.removeEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );
    this.#rootElement?.removeEventListener("focus", this.#handleFocus);

    this.#rootElement?.removeAttribute("aria-label");
    this.#rootElement?.removeAttribute("aria-valuemax");
    this.#rootElement?.removeAttribute("aria-valuenow");
    this.#rootElement?.removeAttribute("aria-valuetext");

    this.#rootElement = null;
    this.#prevDuration = null;
    this.#mouseDown = false;
    this.#readFullTime = true;

    this.removeAttribute("data-readonly");
    this.removeAttribute("data-scrubbing");
    this.style.removeProperty("--beyondwords-progress");

    window.removeEventListener("mouseup", this.#handleMouseUp);
    window.removeEventListener("mousemove", this.#handleMouseMove);
    window.removeEventListener("touchend", this.#handleMouseUp);
    window.removeEventListener("touchmove", this.#handleMouseMove);
  }

  #updateDOM = () => {
    if (!this.#instance) return;

    const currentTime = this.#instance.currentTime;
    const duration = this.#instance.duration;
    const playbackState = this.#instance.playbackState;
    const adverts = this.#instance.adverts;
    const advertIndex = this.#instance.advertIndex;

    const progress = duration > 0 ? currentTime / duration : 0;
    const activeAdvert = adverts[advertIndex];
    const readonly = !!activeAdvert && playbackState !== "stopped";

    this.style.setProperty("--beyondwords-progress", `${progress * 100}%`);

    if (readonly) {
      this.setAttribute("data-readonly", "");
    } else {
      this.removeAttribute("data-readonly");
    }

    if (this.#mouseDown) {
      this.setAttribute("data-scrubbing", "");
    } else {
      this.removeAttribute("data-scrubbing");
    }

    if (this.#prevDuration !== duration) this.#updateAriaValues();
    this.#prevDuration = duration;
  };

  #updateAriaValues = () => {
    if (!this.#instance) return;

    const currentTime = this.#instance.currentTime;
    const duration = this.#instance.duration;

    // prettier-ignore
    const outOf = this.#readFullTime
      ? ` ${window.BeyondWords.translate("outOfTotalTime")} ${window.BeyondWords.humanizeTime(duration)}`
      : "";

    this.#rootElement?.setAttribute(
      "aria-label",
      window.BeyondWords.translate("playbackTime"),
    );
    this.#rootElement?.setAttribute(
      "aria-valuemax",
      Math.floor(duration).toString(),
    );
    this.#rootElement?.setAttribute("aria-valuenow", currentTime.toString());
    this.#rootElement?.setAttribute(
      "aria-valuetext",
      `${window.BeyondWords.humanizeTime(currentTime)}${outOf}`,
    );
  };

  #handleFocus = () => {
    this.#readFullTime = true;
    this.#updateAriaValues();
  };

  #handleKeyDown = (event) => {
    let key;

    if (event.key === "ArrowLeft") key = "Left";
    if (event.key === "ArrowRight") key = "Right";
    if (event.key === " ") key = "Space";
    if (event.key === "Enter") key = "Enter";

    if (!key) return;
    event.preventDefault();

    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: `Pressed${key}OnProgressBar`,
        description: `The ${key.toLowerCase()} key was pressed while the progress bar was focussed.`,
        initiatedBy: "user",
        emittedFrom: "custom-player",
      }),
    );

    if (key === "Left" || key === "Right") this.#handleLeftOrRight();
  };

  #handleMouseDown = (event) => {
    this.#mouseDown = true;
    this.#updateDOM();
    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: "PressedProgressBar",
        description: "The progress bar was pressed at some ratio.",
        initiatedBy: "user",
        ratio: this.#getMouseRatio(event),
        emittedFrom: "custom-player",
      }),
    );
  };

  #handleMouseMove = (event) => {
    if (!this.#mouseDown) return;
    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: "ScrubbedProgressBar",
        description: "The user pressed on the progress bar then dragged.",
        initiatedBy: "user",
        ratio: this.#getMouseRatio(event),
        emittedFrom: "custom-player",
      }),
    );
  };

  #handleMouseUp = () => {
    if (!this.#mouseDown) return;
    this.#mouseDown = false;
    this.#updateDOM();
    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: "FinishedScrubbingProgressBar",
        description: "The user let go after scrubbing the progress bar.",
        initiatedBy: "user",
        emittedFrom: "custom-player",
      }),
    );
  };

  #handleLeftOrRight = () => {
    this.#readFullTime = false;
    this.#updateAriaValues();
  };

  #getMouseRatio = (event) => {
    if (!this.#rootElement) return 0;

    const clientX =
      "clientX" in event ? event.clientX : event.touches?.[0]?.clientX || 0;

    const { x, width } = this.#rootElement.getBoundingClientRect();
    const mouseRatio = (clientX - x) / width;

    return Math.max(0, Math.min(1, mouseRatio));
  };
}

if (!globalThis.customElements.get("beyondwords-progress-bar")) {
  globalThis.customElements.define("beyondwords-progress-bar", ProgressBar);
}

export { ProgressBar };

export default ProgressBar;
