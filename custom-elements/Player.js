class Player extends globalThis.HTMLElement {
  static get observedAttributes() {
    return ["project-id", "content-id"];
  }

  #instance = null;
  #listenerHandle = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        #target {
          display: none;
        }
      </style>
      <div id="target"></div>
      <slot></slot>
    `;
    this.setAttribute("data-initialized", "");
  }

  connectedCallback() {
    this.#instance = new window.BeyondWords.Player({
      target: this.shadowRoot?.querySelector("#target"),
      projectId: this.projectId ?? undefined,
      contentId: this.contentId ?? undefined,
      showUserInterface: false,
    });
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateAttributes,
    );
    this.#updateAttributes();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#listenerHandle = null;
    this.#instance = null;
    this.style.removeProperty("--text-color");
    this.style.removeProperty("--background-color");
    this.style.removeProperty("--icon-color");
    this.style.removeProperty("--highlight-color");
    this.removeAttribute("data-playback-state");
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (newValue === oldValue) return;
    if (!this.#instance) return;
    switch (attrName) {
      case "project-id":
        this.#instance.projectId = newValue;
        break;
      case "content-id":
        this.#instance.contentId = newValue;
        break;
    }
  }

  get instance() {
    return this.#instance;
  }

  get projectId() {
    return this.getAttribute("project-id");
  }

  set projectId(value) {
    if (this.projectId === value) return;
    if (value === null) {
      this.removeAttribute("project-id");
    } else {
      this.setAttribute("project-id", value);
    }
  }

  get contentId() {
    return this.getAttribute("content-id");
  }

  set contentId(value) {
    if (this.contentId === value) return;
    if (value === null) {
      this.removeAttribute("content-id");
    } else {
      this.setAttribute("content-id", value);
    }
  }

  #updateAttributes = () => {
    this.style.setProperty(
      "--bw-text-color",
      this.#instance?.textColor ?? "#111",
    );
    this.style.setProperty(
      "--bw-background-color",
      this.#instance?.backgroundColor ?? "#f5f5f5",
    );
    this.style.setProperty(
      "--bw-icon-color",
      this.#instance?.iconColor ?? "rgba(0, 0, 0, 0.8)",
    );
    this.style.setProperty(
      "--bw-highlight-color",
      this.#instance?.highlightColor ?? "#eee",
    );
    this.setAttribute(
      "data-playback-state",
      this.#instance?.playbackState ?? "stopped",
    );
  };
}

if (!globalThis.customElements.get("beyondwords-player")) {
  globalThis.customElements.define("beyondwords-player", Player);
}

export { Player };

export default Player;
