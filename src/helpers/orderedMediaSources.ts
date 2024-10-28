import stableSort from "./stableSort";

const orderedMediaSources = (mediaObject, preferVideo) => {
  if (!mediaObject) { return []; }

  const audio = (mediaObject.audio || []).map(s => ({ ...s, format: "audio" }));
  const video = (mediaObject.video || []).map(s => ({ ...s, format: "video" }));

  const sortedAudio = stableSort(audio, sortByHlsFirst);
  const sortedVideo = stableSort(video, sortByHlsFirst);

  const sources = preferVideo ? [...sortedVideo, ...sortedAudio] : sortedAudio;
  return sources;
};

const sortByHlsFirst = (a, b) => {
  const isHlsA = a.url.endsWith(".m3u8");
  const isHlsB = b.url.endsWith(".m3u8");

  if (isHlsA && !isHlsB) { return -1; }
  if (!isHlsA && isHlsB) { return 1; }

  return 0;
};

export default orderedMediaSources;
