import BeyondWords from "../src/index";

describe("BeyondWords.Player", () => {
  beforeEach(() => {
    BeyondWords.Player.destroyAll();
  });

  describe(".instances", () => {
    it("returns all player instances", () => {
      const player1 = new BeyondWords.Player({});
      expect(BeyondWords.Player.instances()).toEqual([player1]);

      const player2 = new BeyondWords.Player({});
      expect(BeyondWords.Player.instances()).toEqual([player1, player2]);
    });
  });

  describe(".destroyAll", () => {
    it("calls #destroy on all player instances", () => {
      const player1 = new BeyondWords.Player({});
      const player2 = new BeyondWords.Player({});

      const spy1 = vi.spyOn(player1, "destroy");
      const spy2 = vi.spyOn(player2, "destroy");

      BeyondWords.Player.destroyAll();

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });

  describe("#destroy", () => {
    it("removes the player from the list of instances", () => {
      const player1 = new BeyondWords.Player({});
      const player2 = new BeyondWords.Player({});

      player1.destroy();

      expect(BeyondWords.Player.instances()).toEqual([player2]);
    });

    it("calls #$destroy on the svelte component", () => {
      const player = new BeyondWords.Player({});
      const spy = vi.spyOn(player, "$destroy");

      player.destroy();

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
