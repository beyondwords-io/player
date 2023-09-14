import { useHlsLibrary } from "./loadHlsIfNeeded";

const loadMetadata = (source, video, Hls, hls, onError, play) => {
  hls?.detachMedia?.();
  hls?.destroy?.();

  if (!video || !source) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;
  const wrongSource = video.sourceUrl && video.sourceUrl !== source.url;

  if (useHlsLibrary(source, video)) {
    if (!Hls) { return "pending"; } // loadMedia will be re-called once Hls is ready.

    hls = new Hls({
      enableWorker: false,  // Disable web workers (audio decoding is trivial).
      autoStartLoad: false, // Defer loading audio fragments until playback begins.
      maxBufferLength: 3,   // Load audio fragments 3 seconds in advance.
      ...loadPolicies(),
    });

    hls.on(Hls.Events.ERROR, onError);
    // TODO: check on https://github.com/video-dev/hls.js/issues/5825
    // We might need to call the MediaLoaded event manually for HLS.
    // ... and then prevent it being called again after .startLoad (urgh).
    hls.on(Hls.Events.MANIFEST_LOADED, () => hls.manifestLoaded = true);

    hls.loadSource(source.url);
    hls.attachMedia(video);
  } else if (wrongSource) {
    video.removeAttribute("src");
    video.load();
  }

  if (!prevPaused) { play(); }

  video.playbackRate = prevRate;
  video.sourceUrl = source.url;

  return hls || "not-used";
};

const loadMedia = (hls, startPosition, timeout = 10) => {
  if (hls === "not-used" || hls.loadMediaCalled) { return; }

  // We can't startLoad until the manifest has loaded since it refers to the audio
  // fragments so re-call this function with exponential back off until loaded.
  if (!hls.manifestLoaded) {
    setTimeout(() => loadMedia(hls, startPosition, timeout * 2), timeout);
    return;
  }

  hls.startLoad(startPosition);
  hls.loadMediaCalled = true;
};

const loadPolicies = () => {
  const retryConfig = {
    maxNumRetry: Infinity,
    retryDelayMs: 10,
    maxRetryDelayMs: 2000,
    backoff: "exponential",
  };

  const loaderConfig = {
    maxTimeToFirstByteMs: Infinity,
    maxLoadTimeMs: 999999999999,
    timeoutRetry: retryConfig,
    errorRetry: retryConfig,
  };

  const loadPolicy = {
    default: loaderConfig,
  };

  return {
    fragLoadPolicy: loadPolicy,
    keyLoadPolicy: loadPolicy,
    certLoadPolicy: loadPolicy,
    playlistLoadPolicy: loadPolicy,
    manifestLoadPolicy: loadPolicy,
    steeringManifestLoadPolicy: loadPolicy,
  };
};

export { loadMetadata, loadMedia };
