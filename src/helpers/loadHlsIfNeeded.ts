let Hls;

const loadHlsIfNeeded = async (source, video) => {
  if (useHlsLibrary(source, video)) { await loadHlsLibrary(); }
  return Hls;
};

const useHlsLibrary = (source, video) => {
  const isMounted = source && video;
  if (!isMounted) { return false; }

  const isHlsSource = source?.contentType === "application/x-mpegURL";
  if (!isHlsSource) { return false; }

  const nativeSupport = video?.canPlayType("application/vnd.apple.mpegurl");
  if (nativeSupport) { return false; }

  // Hls will be null the first time through this code but we call this function
  // again in loadMedia before choosing to use the Hls library for playback.
  const librarySupport = Hls ? Hls.isSupported() : true;
  if (!librarySupport) { return false; }

  return true;
};

const loadHlsLibrary = async () => {
  const previous = window.Hls;

  Hls ||= (await import("hls.js/dist/hls.light.min.js")).default;
  Hls ||= window.Hls;

  window.Hls = previous;
};

export default loadHlsIfNeeded;
export { useHlsLibrary };
