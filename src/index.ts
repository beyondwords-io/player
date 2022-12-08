import Hello from "./components/Hello.svelte";
new Hello({ target: document.body });

import PlayerComponent from "./components/Player.svelte";
import resolveTarget from "./helpers/resolveTarget";

class Player extends PlayerComponent {
  static #instances = [];

  constructor({ target, ...props }) {
    const { newTarget, showUserInterface } = resolveTarget(target);

    super({
      target: newTarget,
      props: {
        showUserInterface,
        ...props,
      }
    });

    Player.#instances.push(this);
  }

  static instances() {
    return [...Player.#instances];
  }

  static destroyAll() {
    Player.#instances.forEach(p => p.destroy());
  }

  destroy() {
    Player.#instances = Player.#instances.filter(p => p !== this);
  }
}

const BeyondWords = { Player };

export default BeyondWords;
