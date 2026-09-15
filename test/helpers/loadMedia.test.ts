describe("HLS media loading", () => {
  const source = { url: "blob:https://example.com/manifest", contentType: "application/x-mpegURL" };
  let loadHlsIfNeeded, loadMetadata, loadMedia, Hls, hls, handlers, video, onMetadata, play;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36");

    handlers = new Map();
    hls = {
      on: vi.fn((event, callback) => handlers.set(event, callback)),
      loadSource: vi.fn(),
      attachMedia: vi.fn(),
      startLoad: vi.fn(),
    };
    Hls = Object.assign(vi.fn(() => hls), {
      isSupported: vi.fn(() => true),
      Events: { ERROR: "error", MANIFEST_LOADED: "manifestLoaded" },
    });
    vi.doMock("hls.js/dist/hls.light.min.js", () => ({ default: Hls }));
    ({ default: loadHlsIfNeeded } = await import("../../src/helpers/loadHlsIfNeeded"));
    ({ loadMetadata, loadMedia } = await import("../../src/helpers/loadMedia"));

    video = { canPlayType: () => "maybe", paused: true, playbackRate: 1, currentSrc: "", load: vi.fn() };
    onMetadata = vi.fn();
    play = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.doUnmock("hls.js/dist/hls.light.min.js");
    vi.resetModules();
  });

  const initialize = async () => {
    const library = await loadHlsIfNeeded(source, video);
    return loadMetadata(source, video, library, undefined, vi.fn(), onMetadata, play);
  };

  it("waits for the lazy library before handing the source to a media loader", () => {
    const result = loadMetadata(source, video, undefined, undefined, vi.fn(), onMetadata, play);

    expect(result).toBe("pending");
    expect(Hls).not.toHaveBeenCalled();
    expect(video.load).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it("loads blob metadata without starting fragments while idle", async () => {
    expect(await initialize()).toBe(hls);
    expect(Hls).toHaveBeenCalledWith(expect.objectContaining({ autoStartLoad: false }));
    expect(hls.loadSource).toHaveBeenCalledWith(source.url);
    expect(hls.attachMedia).toHaveBeenCalledWith(video);

    handlers.get(Hls.Events.MANIFEST_LOADED)();
    vi.advanceTimersByTime(30000);

    expect(onMetadata).toHaveBeenCalledOnce();
    expect(hls.startLoad).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it("starts loading at the requested position when playback begins", async () => {
    await initialize();
    handlers.get(Hls.Events.MANIFEST_LOADED)();

    loadMedia(hls, 37.5);
    loadMedia(hls, 50);

    expect(hls.startLoad).toHaveBeenCalledOnce();
    expect(hls.startLoad).toHaveBeenCalledWith(37.5);
  });

  it("waits for the manifest when playback is requested before metadata is ready", async () => {
    await initialize();
    loadMedia(hls, 12);
    vi.advanceTimersByTime(10);
    expect(hls.startLoad).not.toHaveBeenCalled();

    handlers.get(Hls.Events.MANIFEST_LOADED)();
    vi.advanceTimersByTime(20);

    expect(hls.startLoad).toHaveBeenCalledOnce();
    expect(hls.startLoad).toHaveBeenCalledWith(12);
  });

  it("keeps native/source fallback available if the loaded library is unsupported", async () => {
    Hls.isSupported.mockReturnValue(false);

    expect(await initialize()).toBe("not-used");
    expect(Hls).not.toHaveBeenCalled();
    expect(hls.startLoad).not.toHaveBeenCalled();
  });
});
