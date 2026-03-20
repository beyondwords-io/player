const rewriteMediaUrl = (url, mediaCustomUrl) => {
  if (!mediaCustomUrl || !url || url.startsWith("blob:")) { return url; }

  try {
    const parsed = new URL(url);
    parsed.port = "";
    parsed.host = mediaCustomUrl;
    return parsed.toString();
  } catch {
    return url;
  }
};

export default rewriteMediaUrl;
