import Hls from "hls.js/dist/hls.light.js";

const loadMedia = (source, video, hls, onError) => {
  if (!video) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;

  hls?.detachMedia();

  const isStreamable = (source || {}).contentType === "application/x-mpegURL";
  const libraryHlsSupported = Hls.isSupported();
  const nativeHlsSupported = video.canPlayType("application/vnd.apple.mpegurl");

  const useLibraryHls = isStreamable && libraryHlsSupported && !nativeHlsSupported;

  if (useLibraryHls) {
    hls = hls || new Hls({ enableWorker: false });

    hls.on(Hls.Events.ERROR, onError);

    hls.loadSource(source.url);
    hls.attachMedia(video);
  } else {
    video.load();
  }

  if (!prevPaused) { video.play(); }
  video.playbackRate = prevRate;

  return hls;
};

export default loadMedia;
