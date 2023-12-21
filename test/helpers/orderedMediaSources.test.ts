import orderedMediaSources from "../../src/helpers/orderedMediaSources";

describe("orderedMediaSources", () => {
  const mediaObject = {
    audio: [
      { url: "audio.mp3" },
      { url: "audio.m3u8" },
    ],
    video: [
      { url: "video.mp4" },
      { url: "video.m3u8" },
    ],
  };

  it("returns returns audio sources when preferVideo is false", () => {
    // We don't fall back to video sources because the video element isn't
    // visible and Google Cloud console doesn't like this from an SEO standpoint.

    const sources = orderedMediaSources(mediaObject);
    expect(sources.length).toEqual(2);

    const urls = sources.map(s => s.url).sort();
    expect(urls).toEqual(["audio.m3u8", "audio.mp3"]);
  });

  it("returns audio and video sources when preferVideo is true", () => {
    const sources = orderedMediaSources(mediaObject, true);
    expect(sources.length).toEqual(4);

    const urls = sources.map(s => s.url).sort();
    expect(urls).toEqual(["audio.m3u8", "audio.mp3", "video.m3u8", "video.mp4"]);
  });

  it("adds the 'format' property to returned sources", () => {
    const sources = orderedMediaSources(mediaObject, true);
    const formats = sources.map(s => s.format).sort();

    expect(formats).toEqual(["audio", "audio", "video", "video"]);
  });

  it("does not mutate mediaObject", () => {
    orderedMediaSources(mediaObject, true);

    expect(mediaObject.audio[0].format).toBeUndefined();
  });

  it("does not error if the audio or video properties are undefined", () => {
    expect(() => orderedMediaSources({}, true)).not.toThrowError();
  });

  it("orders by .m3u8 sources followed by .mp3 or .mp4 within each media format", () => {
    // We prefer the streamable formats so that bandwidth is reduced. We
    // shouldn't rely on the /player API return sources in the expected order.

    const sources = orderedMediaSources(mediaObject, true);
    const urls = sources.map(s => s.url);

    expect(urls).toEqual(["video.m3u8", "video.mp4", "audio.m3u8", "audio.mp3"]);
  });

  it("orders by .mp3 and .mp4 sources followed by .m3u8 in Android Chrome if a startPosition is given", () => {
    // This does not set the start position correctly in Android Chrome: <source src="media.m3u8#t=5" />
    // So we prefer .mp3 and .mp4 media instead in AndroidChrome is startPosition is set.

    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Android Chrome");

    const sources = orderedMediaSources(mediaObject, true, 5);
    const urls = sources.map(s => s.url);

    expect(urls).toEqual(["video.mp4", "audio.mp3", "video.m3u8", "audio.m3u8"]);
  });

  it("does not change the order of sources for Android Chrome if there is no startPosition", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Android Chrome");

    const sources = orderedMediaSources(mediaObject, true);
    const urls = sources.map(s => s.url);

    expect(urls).toEqual(["video.m3u8", "video.mp4", "audio.m3u8", "audio.mp3"]);
  });

  it("does not change the order of sources for other browsers if a startPosition is given", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla Firefox");

    const sources = orderedMediaSources(mediaObject, true);
    const urls = sources.map(s => s.url);

    expect(urls).toEqual(["video.m3u8", "video.mp4", "audio.m3u8", "audio.mp3"]);
  });
});
