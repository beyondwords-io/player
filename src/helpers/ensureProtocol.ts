const ensureProtocol = (href) => {
  if (!href || href?.startsWith("http")) {
    return href;
  } else {
    return `https://${href}`;
  }
};

export default ensureProtocol;
