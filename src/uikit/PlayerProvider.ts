import { Player } from "../Player";

class PlayerProvider extends globalThis.HTMLElement {
  static get observedAttributes() {
    return ["project-id", "content-id"];
  }

  player: Player | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
      <style>
        #target {
          display: none;
        }
      </style>
      <div id="target"></div>
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.player = new Player({
      target: this.shadowRoot?.querySelector("#target"),
      showUserInterface: false,
      projectId: this.projectId ?? undefined,
      contentId: this.contentId ?? undefined,
    });
  }

  disconnectedCallback() {
    this.player?.destroy();
    this.player = null;
  }

  async attributeChangedCallback(
    attrName: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (!this.player || newValue === oldValue) return;
    switch (attrName) {
    case "project-id":
      this.player.projectId = newValue;
      break;
    case "content-id":
      this.player.contentId = newValue;
      break;
    }
  }

  get projectId() {
    return this.getAttribute("project-id");
  }

  set projectId(value: string | null) {
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

  set contentId(value: string | null) {
    if (this.contentId === value) return;
    if (value === null) {
      this.removeAttribute("content-id");
    } else {
      this.setAttribute("content-id", value);
    }
  }
}

if (!globalThis.customElements.get("beyondwords-player-provider")) {
  globalThis.customElements.define(
    "beyondwords-player-provider",
    PlayerProvider,
  );
}

export { PlayerProvider };

export default PlayerProvider;
