const source = { url: "blob:https://example.com/manifest", contentType: "application/x-mpegURL" };
const desktop = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

const libraryBrowsers = [
  ["Chrome", `${desktop} Chrome/152.0.0.0 Safari/537.36`],
  ["Chromium", `${desktop} Chromium/152.0.0.0 Safari/537.36`],
  ["Edge", `${desktop} Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0`],
  ["Brave", `${desktop} Chrome/152.0.0.0 Safari/537.36`],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/152.0.0.0 Mobile Safari/537.36"],
  ["Android without Chrome", "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Version/4.0 Mobile Safari/537.36"],
  ["lowercase Chrome", `${desktop} chrome/152.0.0.0 Safari/537.36`],
];

const nativeBrowsers = [
  ["macOS Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15"],
  ["iOS Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"],
  ["iPadOS Safari", "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"],
  ["iOS Chrome", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/152.0.0.0 Mobile/15E148 Safari/604.1"],
];

describe("loadHlsIfNeeded", () => {
  let loadHlsIfNeeded, useHlsLibrary, Hls, importLibrary;

  beforeEach(async () => {
    vi.resetModules();
    Hls = { isSupported: vi.fn(() => true) };
    importLibrary = vi.fn(() => ({ default: Hls }));
    vi.doMock("hls.js/dist/hls.light.min.js", importLibrary);
    ({ default: loadHlsIfNeeded, useHlsLibrary } = await import("../../src/helpers/loadHlsIfNeeded"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("hls.js/dist/hls.light.min.js");
    vi.resetModules();
  });

  it.each(libraryBrowsers.flatMap(([browser, userAgent]) => (
    ["", "maybe", "probably"].map(nativeSupport => ({ browser, userAgent, nativeSupport }))
  )))("uses hls.js on $browser when native support is '$nativeSupport'", async ({ userAgent, nativeSupport }) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
    const video = { canPlayType: vi.fn(() => nativeSupport) };

    expect(useHlsLibrary(source, video)).toBe(true);
    expect(importLibrary).not.toHaveBeenCalled();

    expect(await loadHlsIfNeeded(source, video)).toBe(Hls);
    expect(useHlsLibrary(source, video)).toBe(true);
    expect(Hls.isSupported).toHaveBeenCalledOnce();
    expect(video.canPlayType).toHaveBeenCalledWith("application/vnd.apple.mpegurl");
  });

  it.each(nativeBrowsers.flatMap(([browser, userAgent]) => (
    ["maybe", "probably"].map(nativeSupport => ({ browser, userAgent, nativeSupport }))
  )))("keeps native HLS on $browser when native support is '$nativeSupport'", async ({ userAgent, nativeSupport }) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
    const video = { canPlayType: () => nativeSupport };

    expect(useHlsLibrary(source, video)).toBe(false);
    expect(await loadHlsIfNeeded(source, video)).toBeUndefined();
    expect(importLibrary).not.toHaveBeenCalled();
  });

  it("uses hls.js when native HLS is unavailable in another browser", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Firefox/140.0");
    const video = { canPlayType: () => "" };

    expect(await loadHlsIfNeeded(source, video)).toBe(Hls);
    expect(useHlsLibrary(source, video)).toBe(true);
  });

  it.each([
    [undefined, { canPlayType: () => "" }],
    [source, undefined],
    [{ url: "https://example.com/compiled.mp3", contentType: "audio/mpeg" }, { canPlayType: () => "" }],
  ])("does not load hls.js without mounted HLS media (%#)", async (mediaSource, video) => {
    expect(useHlsLibrary(mediaSource, video)).toBe(false);
    expect(await loadHlsIfNeeded(mediaSource, video)).toBeUndefined();
    expect(importLibrary).not.toHaveBeenCalled();
  });

  it("reuses the library across player instances and still respects native playback", async () => {
    const userAgent = vi.spyOn(navigator, "userAgent", "get").mockReturnValue(libraryBrowsers[0][1]);
    const video = { canPlayType: () => "maybe" };

    expect(await loadHlsIfNeeded(source, video)).toBe(Hls);
    expect(await loadHlsIfNeeded(source, { ...video })).toBe(Hls);
    expect(importLibrary).toHaveBeenCalledOnce();

    userAgent.mockReturnValue(nativeBrowsers[0][1]);
    expect(useHlsLibrary(source, video)).toBe(false);
  });

  it("rechecks library support after loading and permits native/source fallback when unsupported", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(libraryBrowsers[0][1]);
    const video = { canPlayType: () => "maybe" };
    Hls.isSupported.mockReturnValue(false);

    expect(useHlsLibrary(source, video)).toBe(true);
    expect(await loadHlsIfNeeded(source, video)).toBe(Hls);
    expect(useHlsLibrary(source, video)).toBe(false);
    expect(importLibrary).toHaveBeenCalledOnce();
  });
});
