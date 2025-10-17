class PlayPauseButton extends globalThis.HTMLElement {
  #instance = null;
  #listenerHandle = null;
  #buttonElement = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host([data-state="playing"]) slot[name=play],
        :host([data-state="paused"]) slot[name=pause] {
          display: none;
        }
      </style>
      <slot name="root">
        <button type="button" tabindex="0" role="button" part="root">
          <slot name="play"></slot>
          <slot name="pause"></slot>
        </button>
      </slot>
    `;
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

    this.#buttonElement = this.shadowRoot.querySelector("button");
    if (this.#buttonElement) {
      this.#buttonElement.onclick = this.#handleClick;
      this.#buttonElement.onmouseup = window.BeyondWords.blurElement;
    }

    this.#updateAttributes();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#listenerHandle = null;
    this.#instance = null;

    if (this.#buttonElement) {
      this.#buttonElement.onclick = null;
      this.#buttonElement.onmouseup = null;
      this.#buttonElement = null;
    }

    this.removeAttribute("data-state");
  }

  #updateAttributes = () => {
    this.setAttribute(
      "data-state",
      this.#instance?.playbackState === "playing" ? "playing" : "paused",
    );
    this.#buttonElement?.setAttribute(
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
