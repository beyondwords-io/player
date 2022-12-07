import Player from "../src/player";

describe("Player", () => {
  beforeEach(() => {
    Player.destroyAll();
  });

  describe(".all", () => {
    it("returns all player instances", () => {
      const player1 = new Player({});
      expect(Player.all()).toEqual([player1]);

      const player2 = new Player({});
      expect(Player.all()).toEqual([player1, player2]);
    });
  });

  describe(".destroyAll", () => {
    it("calls #destroy on all player instances", () => {
      const player1 = new Player({});
      const player2 = new Player({});

      const spy1 = vi.spyOn(player1, "destroy");
      const spy2 = vi.spyOn(player2, "destroy");

      Player.destroyAll();

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });

  describe("#destroy", () => {
    it("removes the player from the static array", () => {
      const player1 = new Player({});
      const player2 = new Player({});

      player1.destroy();

      expect(Player.all()).toEqual([player2]);
    });
  });
});
