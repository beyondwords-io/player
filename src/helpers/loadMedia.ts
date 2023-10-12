import { useHlsLibrary } from "./loadHlsIfNeeded";
import hlsLoadPolicies from "./hlsLoadPolicies";

const loadMetadata = (source, video, Hls, hls, onError, onMetadata, play) => {
  if (window.disableMediaLoad) { return; }

  hls?.detachMedia?.();
  hls?.destroy?.();

  if (!video || !source) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;
  const wrongSource = video.sourceUrl && video.sourceUrl !== source.url;

  if (useHlsLibrary(source, video)) {
    if (!Hls) { return "pending"; } // loadMedia will be re-called once Hls is ready.

    hls = new Hls({
      enableWorker: false,  // Don't use web workers since it's not our website.
      autoStartLoad: false, // Defer loading audio fragments until playback begins.
      maxBufferLength: 5,   // Load audio fragments 5 seconds in advance.
      ...hlsLoadPolicies()  // Specify the retry logic (always retry, never error).
    });

    hls.on(Hls.Events.ERROR, onError);
    hls.on(Hls.Events.MANIFEST_LOADED, () => { hls.manifestLoaded = true; onMetadata({ fromHls: true }); });

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
  if (!hls || hls === "not-used" || hls.loadMediaCalled) { return; }

  // We can't startLoad until the manifest has loaded. Re-call with exponential back off.
  if (!hls.manifestLoaded) {
    setTimeout(() => loadMedia(hls, startPosition, timeout * 2), timeout);
    return;
  }

  hls.startLoad(startPosition);
  hls.loadMediaCalled = true;
};

export { loadMetadata, loadMedia };
