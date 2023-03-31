const blobForImageUrl = (imageUrl, width, height) => {
  revokePreviousUrls(imageUrl);

  const image = new Image();
  image.setAttribute("crossorigin", "anonymous");

  return new Promise((resolve, reject) => {
    image.addEventListener("load", handleLoad(image, width, height, resolve, reject));
    image.addEventListener("error", reject);

    image.src = imageUrl;
  });
};

const handleLoad = (image, width, height, resolve, reject) => () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  const [x, y, w, h] = preserveAspectInTheMiddle(image, canvas);
  context.drawImage(image, x, y, w, h);
  canvas.toBlob(handleToBlob(image, width, height, resolve, reject)); // png by default.
};

const preserveAspectInTheMiddle = (image, canvas) => {
  const imageAspect = image.width / image.height;
  const canvasAspect = canvas.width / canvas.height;

  let width = 0;
  let height = 0;
  let xOffset = 0;
  let yOffset = 0;

  if (imageAspect > canvasAspect) {
    return [0, (canvas.height - height) / 2, canvas.width, width / imageAspect];
  } else {
    return [(canvas.width - width) / 2, 0, height * imageAspect, canvas.height];
  }

  return { width, height, xOffset, yOffset };
}

const objectUrls = {};

const handleToBlob = (image, width, height, resolve, reject) => (blob) => {
  if (!blob) { reject(); }

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
