const blurElement = (event) => {
  const triggeredByNvdaScreenReader = event.detail === 0;
  if (triggeredByNvdaScreenReader) { return; }

  event.currentTarget.blur();
};

export default blurElement;
