const findLoadedMedia = (sources, videoElement) => {
  const videoSrc = srcWithoutHash(videoElement?.currentSrc);
  const source = sources.find(source => {
    const matchesUrl = source.url && videoSrc === absoluteUrl(source.url);
    const matchesHls = source.url?.endsWith(".m3u8") && videoSrc?.startsWith("blob:");

    return matchesUrl || matchesHls;
  });

  if (!source) { console.warn("BeyondWords.Player: media was loaded but failed to set loadedMedia"); }
  return source;
};

const srcWithoutHash = (src) => {
  let url;
  try { url = new URL(src); } catch (e) { return src; }
  if (!url.hash) { return src; }
  return src?.slice(0, -url.hash.length);
};

const absoluteUrl = (url) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  return anchor.href;
};

export default findLoadedMedia;
