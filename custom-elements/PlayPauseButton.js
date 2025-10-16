class PlayPauseButton extends globalThis.HTMLElement {
  #instance = null;
  #listenerHandle = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host([data-state="playing"]) slot[name=play],
        :host([data-state="paused"]) slot[name=pause] {
          display: none !important;
        }
      </style>
        <slot name="icon">
          <slot name="play"></slot>
          <slot name="pause"></slot>
        </slot>
    `;
    this.tabIndex = 0;
    this.setAttribute("role", "button");
  }

  connectedCallback() {
    const playerElement = this.closest("beyondwords-player");
    if (!(playerElement instanceof HTMLElement)) {
      console.error(
        "beyondwords-play-pause-button must be used within a beyondwords-player",
      );
      return;
    }
    this.#instance = playerElement.instance;
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateAttributes,
    );
    this.#updateAttributes();
    if (this.onclick === null) this.onclick = this.#handleClick;
    if (this.onmouseup === null)
      this.onmouseup = window.BeyondWords.blurElement;
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#listenerHandle = null;
    this.#instance = null;
    if (this.onclick === this.#handleClick) this.onclick = null;
    if (this.onmouseup === window.BeyondWords.blurElement)
      this.onmouseup = null;
    this.removeAttribute("data-state");
  }

  #updateAttributes = () => {
    this.setAttribute(
      "data-state",
      this.#instance?.playbackState === "playing" ? "playing" : "paused",
    );
    this.setAttribute(
      "aria-label",
      this.#instance?.playbackState === "playing"
        ? window.BeyondWords.translate("pauseAudio")
        : window.BeyondWords.translate("playAudio"),
    );
  };

  #handleClick = (event) => {
    event.preventDefault();
    const name = this.#instance?.playbackState === "playing" ? "Pause" : "Play";
    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: `Pressed${name}`,
        description: `The ${name.toLowerCase()} button was pressed.`,
        initiatedBy: "user",
        emittedFrom: "custom-player",
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
