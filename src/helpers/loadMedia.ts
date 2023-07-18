const loadMedia = async (source, video, hls, onError, play, startPosition) => {
  if (!video) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;

  (await hls)?.detachMedia();
  (await hls)?.destroy();

  const isHls = (source || {}).contentType === "application/x-mpegURL";
  const nativeSupport = video.canPlayType("application/vnd.apple.mpegurl");

  const Hls = isHls && !nativeSupport && (await loadHlsLibrary());
  const useLibraryHls = Hls?.isSupported?.();

  if (useLibraryHls) {
    hls = new Hls({ enableWorker: false, ...{ startPosition } });

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

let Hls;
const loadHlsLibrary = async () => {
  if (Hls) { return Hls; }
  const previous = window.Hls;

  Hls ||= (await import("hls.js/dist/hls.light.min.js")).default;
  Hls ||= window.Hls;

  window.Hls = previous;
  return Hls;
};

export default loadMedia;
