const erroredAdverts = { vastUrls: new Map(), mediaSources: new Set() };
const vastBanDuration = 60000; // 60 seconds

const updateErroredAdverts = (advert) => {
  if (advert.vastUrl) {
    erroredAdverts.vastUrls.set(advert.vastUrl, Date.now());
  }

  for (const media of [...(advert.audio || []), ...(advert.video || [])]) {
    erroredAdverts.mediaSources.add(media.url);
  }
};

const resultedInAPlaybackError = (advert) => {
  if (advert.vastUrl) {
    const erroredAt = erroredAdverts.vastUrls.get(advert.vastUrl) || -Infinity;
    if (Date.now() - erroredAt < vastBanDuration) { return true; }
  }

  for (const media of [...(advert.audio || []), ...(advert.video || [])]) {
    if (erroredAdverts.mediaSources.has(media.url)) { return true; }
  }

  return false;
};

export { updateErroredAdverts, resultedInAPlaybackError };
