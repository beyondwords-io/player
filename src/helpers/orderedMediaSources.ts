import elementIsVisible from "./elementIsVisible";

const orderedMediaSources = (mediaObject, videoElement) => {
  if (!mediaObject) { return []; }

  const audio = (mediaObject.audio || []).map(s => ({ ...s, format: "audio" }));
  const video = (mediaObject.video || []).map(s => ({ ...s, format: "video" }));

  if (elementIsVisible(videoElement)) {
    return [...video, ...audio];
  } else {
    return [...audio, ...video];
  }
};

export default orderedMediaSources;
