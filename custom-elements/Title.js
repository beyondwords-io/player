class Title extends globalThis.HTMLElement {
  #instance = null;
  #listenerHandle = null;
  #rootSlot = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <slot name="root"></slot>
    `;
  }

  connectedCallback() {
    const playerElement = this.closest("beyondwords-player");
    if (!(playerElement instanceof HTMLElement)) {
      console.error(
        "beyondwords-title must be used within a beyondwords-player",
      );
      return;
    }
    if (!playerElement.instance) {
      console.error(
        "beyondwords-title created with uninitialized beyondwords-player",
      );
      return;
    }

    this.#instance = playerElement.instance;
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateDOM,
    );

    this.#rootSlot = this.shadowRoot.querySelector('slot[name="root"]');

    this.#updateDOM();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#instance = null;
    this.#listenerHandle = null;

    this.#rootSlot = null;
  }

  #updateDOM = () => {
    if (!this.#instance) return;

    if (this.#rootSlot) {
      this.#rootSlot.textContent =
        this.#instance?.callToAction ||
        window.BeyondWords.translate("listenToThisArticle");
    }
  };
}

if (!globalThis.customElements.get("beyondwords-title")) {
  globalThis.customElements.define("beyondwords-title", Title);
}

export { Title };

export default Title;
