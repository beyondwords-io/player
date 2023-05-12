const downloadFile = async (url, filename) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  document.body.append(anchor);

  anchor.href = href;
  anchor.setAttribute("download", filename);
  anchor.setAttribute("target", "_blank");
  anchor.click();
  anchor.remove();
};

export default downloadFile;
