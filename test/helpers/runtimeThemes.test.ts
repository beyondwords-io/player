import { tick } from "svelte";
import BeyondWords from "../../src/index";
import { PLAYER_COLOR_PRESETS, VIDEO_COLOR_PRESET } from "../../src/helpers/default_theme/palettes";

const content = [{
  title: "Literal palette",
  audio: [{ id: 1, url: "https://example.com/audio.mp3", contentType: "audio/mpeg", duration: 60 }],
  video: [],
  segments: [],
}];
const video = [{ id: 2, url: "https://example.com/video.mp4", contentType: "video/mp4", duration: 60, videoSize: { width: 1280, height: 720 } }];

describe("runtime themes", () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
    BeyondWords.Player.destroyAll();
    document.body.innerHTML = "<div id='player'></div>";

    const matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal("matchMedia", matchMedia);
    Object.defineProperty(window, "matchMedia", { value: matchMedia, configurable: true });
  });

  afterEach(() => {
    BeyondWords.Player.destroyAll();
    vi.unstubAllGlobals();
  });

  const surfaceBackground = () => document.querySelector<HTMLElement>(".default-player .surface")?.style.background;

  it("switches Light and Dark immediately and clears back to the project theme", async () => {
    const player = new BeyondWords.Player({
      target: "#player",
      playerStyle: "default",
      widgetStyle: "none",
      content,
    });
    expect(player.theme).toEqual("light");
    expect(player.lightTheme).toEqual(PLAYER_COLOR_PRESETS.light);
    expect(player.darkTheme).toEqual(PLAYER_COLOR_PRESETS.dark);
    expect(player.videoTheme).toEqual(VIDEO_COLOR_PRESET);
    player.projectTheme = "dark";
    await tick();
    expect(player.theme).toEqual("dark");
    expect(surfaceBackground()).toEqual("rgb(33, 33, 33)");

    player.theme = "light";
    await tick();
    expect(surfaceBackground()).toEqual("rgb(245, 245, 245)");

    player.theme = undefined;
    await tick();
    expect(surfaceBackground()).toEqual("rgb(33, 33, 33)");
  });

  it("rerenders for whole-palette assignments and direct field mutation", async () => {
    const player = new BeyondWords.Player({
      target: "#player",
      playerStyle: "default",
      widgetStyle: "none",
      theme: "light",
      content,
    });
    await tick();

    player.lightTheme = { backgroundColor: "rgb(1, 2, 3)" };
    await tick();
    expect(surfaceBackground()).toEqual("rgb(1, 2, 3)");
    expect(player.lightTheme.textColor).toEqual(PLAYER_COLOR_PRESETS.light.textColor);

    player.lightTheme.backgroundColor = "rgb(4, 5, 6)";
    await tick();
    expect(surfaceBackground()).toEqual("rgb(4, 5, 6)");
  });

  it("honours exact legacy flat defaults when explicitly supplied", async () => {
    const player = new BeyondWords.Player({
      target: "#player",
      playerStyle: "default",
      widgetStyle: "none",
      textColor: "#111",
      highlightColor: "#eee",
      content,
    });
    await tick();

    expect(player.lightTheme.textColor).toEqual("#111");
    expect(player.lightTheme.highlightColor).toEqual("#eee");
  });

  it("hands the literal video background to the media element", async () => {
    new BeyondWords.Player({
      target: "#player",
      playerStyle: "default",
      widgetStyle: "none",
      video: true,
      loadedMedia: { ...video[0], format: "video" },
      videoTheme: { backgroundColor: "rgb(7, 8, 9)" },
      content: [{ ...content[0], video }],
    });
    await tick();

    expect(document.querySelector<HTMLElement>("#player")?.style.getPropertyValue("--beyondwords-video-background"))
      .toEqual("rgb(7, 8, 9)");
  });

  it("keeps per-field SDK precedence while API palettes change", async () => {
    const player = new BeyondWords.Player({
      target: "#player",
      playerStyle: "default",
      widgetStyle: "none",
      textColor: "#111",
      lightTheme: { iconColor: "named-icon" },
      content,
    });
    player.apiLightTheme = {
      backgroundColor: "api-background-1",
      textColor: "api-text",
      iconColor: "api-icon",
      linkColor: "api-link",
    };
    await tick();

    expect(player.lightTheme).toMatchObject({
      backgroundColor: "api-background-1",
      textColor: "#111",
      iconColor: "named-icon",
      linkColor: "api-link",
      subtleColor: PLAYER_COLOR_PRESETS.light.subtleColor,
    });

    player.lightTheme.linkColor = "runtime-link";
    player.apiLightTheme = { ...player.apiLightTheme, backgroundColor: "api-background-2", linkColor: "api-link-2" };
    await tick();

    expect(player.lightTheme).toMatchObject({
      backgroundColor: "api-background-2",
      linkColor: "runtime-link",
    });
  });
});
