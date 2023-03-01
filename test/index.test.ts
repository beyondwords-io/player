import BeyondWords from "../src/index";

describe("BeyondWords.Player", () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
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

  describe("#target", () => {
    it("returns the DOM element that mounts the svelte component", () => {
      const element = document.createElement("div");
      element.id = "something";
      document.body.appendChild(element);

      const player = new BeyondWords.Player({ target: "#something" });
      expect(player.target).toEqual(element);
    });
  });

  describe("#target=", () => {
    it("throws a helpful error with a couple of suggestions", () => {
      const player = new BeyondWords.Player({});

      expect(() => player.target = "#something").toThrow(/call player.destroy\(\) and initialize a new player/i);
      expect(() => player.target = "#something").toThrow(/player.showUserInterface = <bool>/);
    });
  });
});
