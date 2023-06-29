import elementIsVisible from "./elementIsVisible";

const orderedMediaSources = (mediaObject, videoElement) => {
  if (!mediaObject) { return []; }

  const audio = mediaObject.audio || [];
  const video = mediaObject.video || [];

  if (elementIsVisible(videoElement)) {
    return [...video, ...audio];
  } else {
    return [...audio, ...video];
  }
};

export default orderedMediaSources;
