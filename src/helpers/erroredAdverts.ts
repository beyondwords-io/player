const erroredAdverts = { vastUrls: new Set(), mediaSources: new Set() };

const updateErroredAdverts = (advert) => {
  if (advert.vastUrl) {
    erroredAdverts.vastUrls.add(advert.vastUrl);
  }

  for (const media of [...(advert.audio || []), ...(advert.video || [])]) {
    erroredAdverts.mediaSources.add(media.url);
  }
};

const resultedInAPlaybackError = (advert) => {
  if (advert.vastUrl) {
    if (erroredAdverts.vastUrls.has(advert.vastUrl)) { return true; }
  }

  for (const media of [...(advert.audio || []), ...(advert.video || [])]) {
    if (erroredAdverts.mediaSources.has(media.url)) { return true; }
  }

  return false;
};

export default erroredAdverts;
export { updateErroredAdverts, resultedInAPlaybackError };
