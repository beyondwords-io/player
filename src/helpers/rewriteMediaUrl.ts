const rewriteMediaUrl = (url, mediaCustomUrl) => {
  if (!mediaCustomUrl || !url || url.startsWith("blob:")) { return url; }

  try {
    const { pathname, search, hash } = new URL(url);
    return (new URL(`${pathname}${search}${hash}`, mediaCustomUrl)).href;
  } catch {
    return url;
  }
};

export default rewriteMediaUrl;
