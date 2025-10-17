class NextSegmentButton extends globalThis.HTMLElement {
  #instance = null;
  #buttonElement = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <slot name="root">
        <button type="button" tabindex="0" role="button" part="root">
          <slot></slot>
        </button>
      </slot>
    `;
  }

  connectedCallback() {
    const playerElement = this.closest("beyondwords-player");
    if (!(playerElement instanceof HTMLElement)) {
      console.error(
        "beyondwords-next-segment-button must be used within a beyondwords-player",
      );
      return;
    }
    if (!playerElement.instance) {
      console.error(
        "beyondwords-next-segment-button created with uninitialized beyondwords-player",
      );
      return;
    }

    this.#instance = playerElement.instance;

    this.#buttonElement = this.shadowRoot.querySelector("button[part='root']");

    this.#buttonElement?.addEventListener("click", this.#handleClick);
    this.#buttonElement?.addEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );

    this.#updateDOM();
  }

  disconnectedCallback() {
    this.#instance?.destroy();
    this.#instance = null;

    this.#buttonElement?.removeEventListener("click", this.#handleClick);
    this.#buttonElement?.removeEventListener(
      "mouseup",
      window.BeyondWords.blurElement,
    );
    this.#buttonElement?.removeAttribute("aria-label");

    this.#buttonElement = null;
  }

  #updateDOM = () => {
    this.#buttonElement?.setAttribute(
      "aria-label",
      window.BeyondWords.translate("nextSegment"),
    );
  };

  #handleClick = (event) => {
    event.preventDefault();
    this.#instance?.controller.processEvent(
      window.BeyondWords.newEvent({
        type: "PressedNextSegment",
        description: "The next segment button was pressed.",
        initiatedBy: "user",
        emittedFrom: "custom-player",
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
