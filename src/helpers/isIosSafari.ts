const isIosSafari = () => {
  const userAgent = navigator?.userAgent?.toLowerCase?.() || "";

  const isIos = userAgent.match(/iphone|ipad|ipod/i) && navigator?.maxTouchPoints;
  const isSafari = userAgent.match(/safari|applewebkit/i);

  return isIos && isSafari;
};

export default isIosSafari;
