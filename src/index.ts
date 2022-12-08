import Hello from "./components/Hello.svelte";
new Hello({ target: document.body });

import PlayerComponent from "./components/Player.svelte";
import resolveTarget from "./helpers/resolveTarget";

class Player extends PlayerComponent {
  constructor({ target, ...props }) {
    const { newTarget, showUserInterface } = resolveTarget(target);

    super({
      target: newTarget,
      props: {
        showUserInterface,
        ...props,
      }
    });
  }
}

const BeyondWords = { Player };

export default BeyondWords;
