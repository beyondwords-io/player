import Hls from "hls.js/dist/hls.light.js";

const loadStream = (source, video, hls) => {
  if (hls) { hls.detachMedia(); }

  const prevPaused = video?.paused;
  const prevRate = video?.playbackRate;

  const isPlayable = source && video;
  if (!isPlayable) { return; }

  const isStreamable = source.contentType === "application/x-mpegURL";
  if (!isStreamable) { video?.load(); return; } // Reload when source changes.

  const nativeHlsSupported = video.canPlayType("application/vnd.apple.mpegurl");
  if (nativeHlsSupported) { return; } // Already loaded by video <source>

  const libraryHlsSupported = Hls.isSupported();
  if (!libraryHlsSupported) { return; } // An alternate source will be used.

  hls = hls || new Hls({ enableWorker: false });

  hls.loadSource(source.url);
  hls.attachMedia(video);

  if (!prevPaused) { video.play(); }
  video.playbackRate = prevRate;

  return hls;
};

export default loadStream;
