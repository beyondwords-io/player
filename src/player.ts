class Player {
  static #all = [];

  constructor() {
    Player.#all.push(this);
  }

  static all() {
    return [...Player.#all];
  }

  static destroyAll() {
    Player.#all.forEach(p => p.destroy());
  }

  destroy() {
    Player.#all = Player.#all.filter(p => p !== this);
  }
}

export default Player;
