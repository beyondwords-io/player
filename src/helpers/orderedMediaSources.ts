import stableSort from "./stableSort";

const orderedMediaSources = (mediaObject, preferVideo, videoSizes) => {
  if (!mediaObject) { return []; }

  const audio = (mediaObject.audio || []).map(s => ({ ...s, format: "audio" }));
  const video = (mediaObject.video || []).map(s => ({ ...s, format: "video" }));

  const sortedAudio = stableSort(audio, sortByHlsFirst);
  const sortedVideo = stableSort(sortAndFilterBySize(video, videoSizes), sortByHlsFirst);

  const sources = preferVideo ? [...sortedVideo, ...sortedAudio] : sortedAudio;
  return sources;
};

const sortAndFilterBySize = (video, videoSizes) => {
  if (!videoSizes || videoSizes.length === 0) { return video; }

  const added = new Set();
  const result = [];

  for (const string of videoSizes) {
    for (const item of video) {
      if (!added.has(item) && matchesVideoSize(string, item.videoSize)) {
        added.add(item);
        result.push(item);
      }
    }
  }

  return result;
};

const matchesVideoSize = (string, object) => {
  const n = gcd(object.width, object.height);

  if (string === object.name) { return true; }
  if (string === `${object.width}x${object.height}`) { return true; }
  if (string === `${object.width / n}:${object.height / n}`) { return true; }

  return false;
};

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {
    const tmp = b;
    b = a % b;
    a = tmp;
  }

  return a;
};

const sortByHlsFirst = (a, b) => {
  const isHlsA = a.url.endsWith(".m3u8") || a.url.startsWith("blob:");
  const isHlsB = b.url.endsWith(".m3u8") || b.url.startsWith("blob:");

  if (isHlsA && !isHlsB) { return -1; }
  if (!isHlsA && isHlsB) { return 1; }

  return 0;
};

export default orderedMediaSources;
