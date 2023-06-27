import elementIsVisible from "./elementIsVisible";

const orderedMediaSources = (mediaObject, videoElement) => {
  if (!mediaObject) { return []; }

  let sources;
  if (elementIsVisible(videoElement)) {
    sources = [...(mediaObject.video || []), ...(mediaObject.audio || [])];
  } else {
    sources = mediaObject.audio || [];
  }

  return [sources].flat().filter(s => s);
};

export default orderedMediaSources;
