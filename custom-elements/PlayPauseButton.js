class PlayPauseButton extends globalThis.HTMLElement {
  #instance = null;
  #listenerHandle = null;
  #buttonElement = null;
  #playSlot = null;
  #pauseSlot = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <slot name="root">
        <button type="button" tabindex="0" role="button" part="root">
          <slot name="play"></slot>
          <slot name="pause"></slot>
        </button>
      </slot>
    `;
  }

  connectedCallback() {
    const playerElement =
      this.closest("beyondwords-player") ??
      document.getElementById(this.playerId);
    if (!(playerElement instanceof HTMLElement)) {
      console.error(
        "beyondwords-play-pause-button must be used within a beyondwords-player",
      );
      return;
    }
    if (!playerElement.instance) {
      console.error(
        "beyondwords-play-pause-button created with uninitialized beyondwords-player",
      );
      return;
    }

    this.#instance = playerElement.instance;
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateDOM,
    );

    this.#playSlot = this.shadowRoot.querySelector('slot[name="play"]');
    this.#pauseSlot = this.shadowRoot.querySelector('slot[name="pause"]');
    this.#buttonElement = this.shadowRoot.querySelector("button[part='root']");

    this.#buttonElement?.addEventListener("click", this.#handleClick);
    this.#buttonElement?.addEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );

    this.#updateDOM();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#instance = null;
    this.#listenerHandle = null;

    this.#buttonElement?.removeEventListener("click", this.#handleClick);
    this.#buttonElement?.removeEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );
    this.#buttonElement?.removeAttribute("aria-label");
    this.#playSlot?.removeAttribute("hidden");
    this.#pauseSlot?.removeAttribute("hidden");

    this.#buttonElement = null;
    this.#playSlot = null;
    this.#pauseSlot = null;

    this.removeAttribute("data-state");
  }

  get playerId() {
    return this.getAttribute("player-id");
  }

  set playerId(value) {
    if (this.playerId === value) return;
    if (value === null) {
      this.removeAttribute("player-id");
    } else {
      this.setAttribute("player-id", value);
    }
  }

  #updateDOM = () => {
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
    if (this.#instance?.playbackState === "playing") {
      this.#playSlot?.setAttribute("hidden", "");
      this.#pauseSlot?.removeAttribute("hidden");
    } else {
      this.#pauseSlot?.setAttribute("hidden", "");
      this.#playSlot?.removeAttribute("hidden");
    }
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
