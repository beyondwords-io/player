const blobForSvgNode = (svgElement, width, height) => {
  if (!svgElement) { return; }

  const html = svgElement.innerHTML;
  const src = `data:image/svg+xml,${encodeURIComponent(html)}`;

  return { src, sizes: `${width}x${height}`, type: "image/svg+xml" };
};

export default blobForSvgNode;
