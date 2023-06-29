const findLoadedMedia = (sources, videoElement) => (
  sources.find(source => {
    const matchesUrl = source.url && source.url === videoElement?.currentSrc;
    const matchesHls = source.url?.endsWith(".m3u8") && videoElement?.currentSrc?.startsWith("blob:");

    return matchesUrl || matchesHls;
  })
);

export default findLoadedMedia;
