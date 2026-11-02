const mediaDuration = (object) => {
  if (!object) { return 0; }
  if (object.duration) { return object.duration; }

  const media = object.audio?.[0] || object.video?.[0];
  return media?.duration || 0;
};

export default mediaDuration;
