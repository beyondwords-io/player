import * as stackTraceParser from "stacktrace-parser";

const loadMedia = async (source, video, hls, onError, play, startPosition) => {
  if (!video) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;

  (await hls)?.detachMedia();
  (await hls)?.destroy();

  const isHls = (source || {}).contentType === "application/x-mpegURL";
  const nativeSupport = video.canPlayType("application/vnd.apple.mpegurl");

  const Hls = isHls && !nativeSupport && (await loadHlsLibrary());
  const useLibraryHls = window.Hls?.isSupported?.();

  if (useLibraryHls) {
    hls = new window.Hls({ enableWorker: false, ...{ startPosition } });

    hls.on(Hls.Events.ERROR, onError);

    hls.loadSource(source.url);
    hls.attachMedia(video);
  } else {
    video.removeAttribute("src");
    video.load();
  }

  if (!prevPaused) { play(); }
  video.playbackRate = prevRate;

  return hls;
};

const loadHlsLibrary = async () => {
  const thisFilename = originFilename(new Error());
  const isDevelopment = thisFilename?.match(/loadMedia.ts/); // Not minified.

  let Hls;
  if (isDevelopment) {
    Hls = (await import("hls.js/dist/hls.light.js")).default;
  } else {
    await import("../../dist/hls.light.min.js");
    Hls = window.Hls;
  }

  if (!Hls) { console.warn(`BeyondWords.Player: failed to load the hls.js library`); }
  return Hls;
};

const originFilename = (error) => (
  stackTraceParser.parse(error?.stack || "")[0]?.file
);

export default loadMedia;
