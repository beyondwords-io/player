const isIosChrome = () => {
  const userAgent = navigator?.userAgent?.toLowerCase?.() || "";

  const isIos = userAgent.match(/iphone|ipad|ipod/i) && navigator?.maxTouchPoints;
  const isChrome = userAgent.match(/crios/i);

  return isIos && isChrome;
};

export default isIosChrome;
