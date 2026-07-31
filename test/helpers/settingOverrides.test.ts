import setPropsFromApi from "../../src/helpers/setPropsFromApi";
import { setSetting, resetSetting, resetAllSettings, reapplySettings, overriddenSettings, isOverridden } from "../../src/helpers/settingOverrides";

const mocks = vi.hoisted(() => ({ fetchJson: vi.fn() }));
vi.mock("../../src/helpers/fetchJson", () => ({ default: mocks.fetchJson }));

// The point of this file: a setting somebody changed must survive the next API
// response, and resetting it must land back on the API's own value.
describe("settingOverrides", () => {
  const payload = {
    language: "en",
    content: [{ id: "c1", title: "A title", audio: [{ id: 1, url: "https://example.com/a.mp3", content_type: "audio/mpeg", duration: 30000 }], video: [], segments: [] }],
    settings: {
      theme: "light",
      title_enabled: true,
      background_color: "#eeeeee",
      light_theme: { text_color: "#111111", background_color: "#eeeeee", icon_color: "#222222", highlight_color: "#ffff00", word_highlight_color: "#00ffff" },
      video_theme: { text_color: "#ffffff", background_color: "#000000", icon_color: "#ffffff" },
    },
    video_settings: {},
  };

  const mockPlayer = () => ({
    playerApiUrl: "https://api.example.com/projects/{id}/player",
    projectId: 7,
    contentId: "c1",
    content: [],
    contentIndex: 0,
    initialProps: {},
    onEvent: () => {},
    backgroundColor: "#f5f5f5",
    titleEnabled: true,
    radius: 8,
    playbackState: "stopped",
    playerTitle: undefined,
    accessTier: undefined,
    setAccessTier(value) { this.accessTier = value; },
  });

  beforeEach(() => {
    mocks.fetchJson.mockClear();
    mocks.fetchJson.mockResolvedValue(payload);
  });

  it("keeps a changed setting through the next API response", async () => {
    const player = mockPlayer();

    setSetting(player, "backgroundColor", "yellow");
    expect(isOverridden(player, "backgroundColor")).toEqual(true);

    await setPropsFromApi(player);

    expect(player.backgroundColor).toEqual("yellow");
    expect(player.apiProps.backgroundColor).toEqual("#eeeeee");
  });

  it("stores an emptied setting as null, which still beats the API", async () => {
    const player = mockPlayer();

    setSetting(player, "playerTitle", undefined);
    expect(player.playerTitle).toEqual(null);

    await setPropsFromApi(player);
    expect(player.playerTitle).toEqual(null);
  });

  it("resets to the value the API asked for, without refetching", async () => {
    const player = mockPlayer();
    await setPropsFromApi(player);

    setSetting(player, "backgroundColor", "yellow");
    mocks.fetchJson.mockClear();

    resetSetting(player, "backgroundColor");

    expect(player.backgroundColor).toEqual("#eeeeee");
    expect(isOverridden(player, "backgroundColor")).toEqual(false);
    expect(mocks.fetchJson).not.toHaveBeenCalled();
  });

  it("resets to the player default when the API never sent the setting", () => {
    const player = mockPlayer();

    setSetting(player, "radius", 0);
    resetSetting(player, "radius");

    expect(player.radius).toEqual(8);
  });

  it("does not treat playback state as a setting somebody configured", () => {
    const player = mockPlayer();

    setSetting(player, "playbackState", "playing");

    expect(player.playbackState).toEqual("playing");
    expect(isOverridden(player, "playbackState")).toEqual(false);
  });

  it("clears every changed setting at once, but keeps the identifiers", () => {
    const player = mockPlayer();
    player.initialProps = { projectId: 7, contentId: "c1" };

    setSetting(player, "backgroundColor", "yellow");
    setSetting(player, "radius", 0);

    expect(overriddenSettings(player)).toEqual(["backgroundColor", "radius"]);

    resetAllSettings(player);

    expect(overriddenSettings(player)).toEqual([]);
    expect(player.initialProps).toEqual({ projectId: 7, contentId: "c1" });
    expect(player.radius).toEqual(8);
  });

  it("refetches once for a setting that changes the request", () => {
    const player = mockPlayer();

    setSetting(player, "wordHighlightsEnabled", true);
    expect(mocks.fetchJson).toHaveBeenCalledTimes(1);

    // The player refetches by itself when an identifier changes, so asking for
    // one here would send the request twice.
    setSetting(player, "contentId", "c2");
    expect(mocks.fetchJson).toHaveBeenCalledTimes(1);
  });

  it("re-applies overrides that the API writes around set()", () => {
    const player = mockPlayer();

    setSetting(player, "accessTier", "subscribed");
    expect(player.accessTier).toEqual("subscribed");

    // What setAccessTierProp does with whatever the API echoed back.
    player.accessTier = "anonymous";
    reapplySettings(player);

    expect(player.accessTier).toEqual("subscribed");
  });
});
