const findLoadedMedia = (sources, videoElement) => {
  const source = sources.find(source => {
    const matchesUrl = source.url && videoElement?.currentSrc === absoluteUrl(source.url);
    const matchesHls = source.url?.endsWith(".m3u8") && videoElement?.currentSrc?.startsWith("blob:");

    return matchesUrl || matchesHls;
  });

  if (!source) { console.warn("BeyondWords.Player: media was loaded but failed to set loadedMedia"); }
  return source;
};

const absoluteUrl = (url) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  return anchor.href;
};

export default findLoadedMedia;
