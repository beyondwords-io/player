import { useHlsLibrary } from "./loadHlsIfNeeded";

const loadMedia = (source, video, Hls, hls, onError, play, startPosition) => {
  if (!video) { return; }

  const prevPaused = video.paused;
  const prevRate = video.playbackRate;

  hls?.detachMedia?.();
  hls?.destroy?.();

  if (useHlsLibrary(source, video)) {
    if (!Hls) { return "pending"; } // loadMedia will be re-called once Hls is ready.

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

  return hls || "not-used";
};

export default loadMedia;
