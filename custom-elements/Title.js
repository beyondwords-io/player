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
    const playerElement =
      this.closest("beyondwords-player") ??
      document.getElementById(this.playerId);
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
