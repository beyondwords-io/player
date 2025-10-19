class Player extends globalThis.HTMLElement {
  static get observedAttributes() {
    return ["project-id", "content-id", "video"];
  }

  #instance = null;
  #listenerHandle = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <div id="target"></div>
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.#instance = new window.BeyondWords.Player({
      target: this.shadowRoot?.querySelector("#target"),
      projectId: this.projectId ?? undefined,
      contentId: this.contentId ?? undefined,
      video: this.video ?? undefined,
      showUserInterface: false,
    });
    this.#listenerHandle = this.#instance.addEventListener(
      "<any>",
      this.#updateDOM,
    );

    this.#updateDOM();
  }

  disconnectedCallback() {
    this.#instance?.removeEventListener("<any>", this.#listenerHandle);
    this.#instance?.destroy();
    this.#instance = null;
    this.#listenerHandle = null;

    this.removeAttribute("data-playback-state");
    this.style.removeProperty("--beyondwords-text-color");
    this.style.removeProperty("--beyondwords-background-color");
    this.style.removeProperty("--beyondwords-icon-color");
    this.style.removeProperty("--beyondwords-highlight-color");
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (newValue === oldValue) return;
    switch (attrName) {
      case "project-id":
        if (this.#instance) this.#instance.projectId = newValue;
        break;
      case "content-id":
        if (this.#instance) this.#instance.contentId = newValue;
        break;
      case "video":
        if (this.#instance) this.#instance.video = newValue;
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

  get video() {
    return this.hasAttribute("video");
  }

  set video(value) {
    if (this.video === value) return;
    if (value) {
      this.setAttribute("video", "");
    } else {
      this.removeAttribute("video");
    }
  }

  #updateDOM = () => {
    this.setAttribute("data-initialized", "");
    this.setAttribute(
      "data-playback-state",
      this.#instance?.playbackState ?? "stopped",
    );
    this.style.setProperty(
      "--beyondwords-text-color",
      this.#instance?.textColor ?? "",
    );
    this.style.setProperty(
      "--beyondwords-background-color",
      this.#instance?.backgroundColor ?? "",
    );
    this.style.setProperty(
      "--beyondwords-icon-color",
      this.#instance?.iconColor ?? "",
    );
    this.style.setProperty(
      "--beyondwords-highlight-color",
      this.#instance?.highlightColor ?? "",
    );
  };
}

if (!globalThis.customElements.get("beyondwords-player")) {
  globalThis.customElements.define("beyondwords-player", Player);
}

export { Player };

export default Player;
