class Player {
  static #instances = [];

  constructor() {
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

export default Player;
