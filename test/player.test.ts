import Player from "../src/player";

describe("Player", () => {
  beforeEach(() => {
    Player.all = [];
  });

  describe("constructor", () => {
    it("adds the instance to a static array", () => {
      const player1 = new Player({});
      expect(Player.all).toEqual([player1]);

      const player2 = new Player({});
      expect(Player.all).toEqual([player1, player2]);
    });
  });

  describe("#otherPlayers", () => {
    it("", () => {
      const player1 = new Player({});
      expect(player1.otherPlayers()).toEqual([]);

      const player2 = new Player({});
      expect(player1.otherPlayers()).toEqual([player2]);
      expect(player2.otherPlayers()).toEqual([player1]);
    });
  });
});
