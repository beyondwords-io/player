import elementIsVisible from "./elementIsVisible";

const orderedMediaSources = (mediaObject, videoElement, startPosition) => {
  if (!mediaObject) { return []; }

  const audio = (mediaObject.audio || []).map(s => ({ ...s, format: "audio" }));
  const video = (mediaObject.video || []).map(s => ({ ...s, format: "video" }));

  const preferVideo = elementIsVisible(videoElement); // TODO: change to check playerStyle
  const sources = preferVideo ? [...video, ...audio] : [...audio, ...video];

  if (startPosition && isAndroidChrome()) {
    const nonHlsSources = sources.filter(s => !s.url.endsWith(".m3u8"));
    const hlsSources = sources.filter(s => s.url.endsWith(".m3u8"));

    return [...nonHlsSources, ...hlsSources];
  }

  return sources;
};

const isAndroidChrome = () => {
  const userAgent = navigator?.userAgent?.toLowerCase() || "";
  return userAgent.includes("android") && userAgent.includes("chrome");
};

export default orderedMediaSources;
