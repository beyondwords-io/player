import Hls from "hls.js/dist/hls.light.js";

const loadStream = (source, video, hls) => {
  if (hls) { hls.detachMedia(); }

  const isStreamable = (source || {}).contentType === "application/x-mpegURL";
  if (!isStreamable) { return; }

  const isPlayable = video;
  if (!isPlayable) { return; }

  const nativeHlsSupported = video.canPlayType("application/vnd.apple.mpegurl");
  if (nativeHlsSupported) { return; } // Already loaded by video <source>

  const libraryHlsSupported = Hls.isSupported();
  if (!libraryHlsSupported) { return; }

  hls = hls || new Hls({ enableWorker: false });

  hls.loadSource(source.url);
  hls.attachMedia(video);

  return hls;
};

export default loadStream;
