// The API doesn't yet serialize a top-level duration on summarization (and
// sometimes content), so fall back to the first media variant's duration,
// which setPropsFromApi has already converted to seconds. See S-8883.
const mediaDuration = (object) => {
  if (!object) { return 0; }
  if (object.duration) { return object.duration; }

  const media = object.audio?.[0] || object.video?.[0];
  return media?.duration || 0;
};

export default mediaDuration;
