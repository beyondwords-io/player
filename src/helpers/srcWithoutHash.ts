const srcWithoutHash = (src) => {
  let url;
  try { url = new URL(src); } catch (e) { return src; }
  if (!url.hash) { return src; }
  return src?.slice(0, -url.hash.length);
};

export default srcWithoutHash;
