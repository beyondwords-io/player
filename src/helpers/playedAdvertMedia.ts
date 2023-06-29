// This state is shared across all player instances so that the same advert
// doesn't play again in any player. This does not affect VAST ads because they
// are fetched programmatically and might return a different advert each time.

const playedAdvertMedia = new Set();

const updatePlayedAdvertMedia = (advert) => {
  const media = [...(advert.audio || []), ...(advert.video || [])];
  media.forEach(m => playedAdvertMedia.add(m.url));
};

const alreadyPlayedAdvertMedia = (advert) => {
  const media = [...(advert.audio || []), ...(advert.video || [])];
  return media.some(m => playedAdvertMedia.has(m.url));
};

export default playedAdvertMedia;
export { updatePlayedAdvertMedia, alreadyPlayedAdvertMedia };
