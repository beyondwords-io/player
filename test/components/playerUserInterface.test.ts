import BeyondWords from "../../src/index";
import DefaultInterface from "../../src/components/default_player/DefaultInterface.svelte";
import UserInterface from "../../src/components/UserInterface.svelte";

// chooseWidget skips players without a userInterface, so the widget never
// appears if this reference is lost. The API sets content before playerStyle,
// so a default-style embed first renders the standard interface and swaps.
// The old interface is destroyed after its outro, so every assertion waits
// until only the expected number of interfaces is left in the DOM.
//
// jsdom's requestAnimationFrame passes timestamps from a different clock than
// performance.now(), which Svelte uses to end transitions. Outros then last as
// long as the test process has been running, so use one clock for both.
describe("the player's userInterface", () => {
  const content = [{ title: "Something", audio: [{ id: 1, url: "http://example.com/audio.mp3", contentType: "audio/mpeg", duration: 30 }] }];

  const createPlayer = (props = {}) => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    return new BeyondWords.Player({ target, ...props });
  };

  const settle = async (player, count = 1) => {
    await vi.waitFor(() => {
      expect(player.target.querySelectorAll(".user-interface, .default-player").length).toEqual(count);
    }, { timeout: 2000 });
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  beforeEach(() => {
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
    window.matchMedia ||= () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    vi.stubGlobal("requestAnimationFrame", (callback) => setTimeout(() => callback(performance.now()), 16));
    vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));

    BeyondWords.Player.destroyAll();
  });

  afterEach(() => {
    BeyondWords.Player.destroyAll();
    vi.unstubAllGlobals();
  });

  it("is the standard interface when the player has content", async () => {
    const player = createPlayer({ content });
    await settle(player);

    expect(player.userInterface).toBeInstanceOf(UserInterface);
  });

  it("is the default interface when the style is set before content", async () => {
    const player = createPlayer({ playerStyle: "default", content });
    await settle(player);

    expect(player.userInterface).toBeInstanceOf(DefaultInterface);
  });

  it("is the default interface when the style changes to default after content", async () => {
    const player = createPlayer();

    player.content = content;
    player.playerStyle = "default";
    await settle(player);

    expect(player.userInterface).toBeInstanceOf(DefaultInterface);
  });

  it("is the standard interface when the style changes from default after content", async () => {
    const player = createPlayer({ playerStyle: "default", content });

    player.playerStyle = "standard";
    await settle(player);

    expect(player.userInterface).toBeInstanceOf(UserInterface);
  });

  it("is the new interface when the player language changes", async () => {
    const player = createPlayer({ playerStyle: "default", content });
    const previous = player.userInterface;

    player.playerLanguage = "fr";
    await settle(player);

    expect(player.userInterface).toBeInstanceOf(DefaultInterface);
    expect(player.userInterface).not.toBe(previous);
  });

  it("is empty when the player has no content", async () => {
    const player = createPlayer({ playerStyle: "default", content });

    player.content = [];
    await settle(player, 0);

    expect(player.userInterface).toBeFalsy();
  });
});
