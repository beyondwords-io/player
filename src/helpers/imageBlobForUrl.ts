const imageBlobForUrl = (imageUrl, width, height) => {
  const image = new Image();
  image.setAttribute("crossorigin", "anonymous");

  return new Promise(resolve => {
    image.addEventListener("load", handleLoad(image, width, height, resolve));
    image.src = imageUrl;
    // TODO: reject promise if fails to load image?
  });
};

const handleLoad = (image, width, height, resolve) => () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  context.drawImage(image, 0, 0, width, height);
  canvas.toBlob(handleToBlob(width, height, resolve));
};

const handleToBlob = (width, height, resolve) => (blob) => {
  const src = URL.createObjectURL(blob);

  // TODO: how to revoke URLs? Multiple might be in use at the same time.

  resolve({ src, sizes: `${width}x${height}`, type: "image/png" });
};

export default imageBlobForUrl;
