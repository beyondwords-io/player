const withQueryParams = (src, params = {}) => {
  let url;

  try { url = new URL(src); } catch (e) { return src; }
  const search = new URLSearchParams(url.search);

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }

  url.search = search.toString();
  return url.toString();
};

export default withQueryParams;
