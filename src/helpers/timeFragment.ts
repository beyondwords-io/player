const EPSILON = 0.00001;

const timeFragment = (isFirstLoad, initialTime = 0, format) => {
  if (isFirstLoad && initialTime > 0) {
    return `#t=${initialTime}`;
  } else if (format === "video" && isSafari()) {
    return `#t=${EPSILON}`;
  } else {
    return "";
  }
};

const isSafari = () => {
  const userAgent = navigator?.userAgent?.toLowerCase?.() || "";
  return userAgent.includes("safari") && !userAgent.includes("chrome");
};

export default timeFragment;
export { EPSILON };
