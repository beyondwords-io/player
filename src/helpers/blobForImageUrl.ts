const blobForImageUrl = (imageUrl, width, height) => {
  revokePreviousUrls(imageUrl);

  const image = new Image();
  image.setAttribute("crossorigin", "anonymous");

  return new Promise((resolve, reject) => {
    image.addEventListener("load", handleLoad(image, width, height, resolve));
    image.addEventListener("error", reject);

    image.src = imageUrl;
  });
};

const handleLoad = (image, width, height, resolve) => () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  context.drawImage(image, 0, 0, width, height);
  canvas.toBlob(handleToBlob(image, width, height, resolve)); // png by default.
};

const objectUrls = {};

const handleToBlob = (image, width, height, resolve) => (blob) => {
  // TODO: handle null if blob creation fails
  const src = URL.createObjectURL(blob);

  objectUrls[image.src] ||= [];
  objectUrls[image.src].push(src);

  resolve({ src, sizes: `${width}x${height}`, type: "image/png" });
};

const revokePreviousUrls = (currentUrl) => {
  const previousImageUrls = Object.keys(objectUrls).filter(url => url !== currentUrl);
  const previousObjectUrls = previousImageUrls.map(url => objectUrls[url]).flat();

  previousObjectUrls.forEach(url => URL.revokeObjectURL(url));
};

export default blobForImageUrl;
