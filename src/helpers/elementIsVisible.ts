const elementIsVisible = (element) => {
  if (!element) { return false; }

  const height = window.innerHeight || document.documentElement.clientHeight;
  const width = window.innerWidth || document.documentElement.clientWidth;

  const { top, bottom, left, right } = element.getBoundingClientRect();
  return top < height && bottom > 0 && left < width && right > 0;
};

export default elementIsVisible;
