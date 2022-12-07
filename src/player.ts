class Player {
  static all = [];

  constructor() {
    Player.all.push(this);
  }

  otherPlayers() {
    return Player.all.filter(p => p !== this);
  }
}

export default Player;
