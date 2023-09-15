import { useHlsLibrary } from "./loadHlsIfNeeded";
import hlsLoadPolicies from "./hlsLoadPolicies";

const loadMedia = (source, video, Hls, hls, onError, play, startPosition) => {
  hls?.detachMedia?.();
  hls?.destroy?.();

  if (!video || !source) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;
  const wrongSource = video.sourceUrl && video.sourceUrl !== source.url;

  if (useHlsLibrary(source, video)) {
    if (!Hls) { return "pending"; } // loadMedia will be re-called once Hls is ready.

    hls = new Hls({ enableWorker: false, startPosition, ...hlsLoadPolicies() });
    hls.on(Hls.Events.ERROR, onError);

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

export default loadMedia;
