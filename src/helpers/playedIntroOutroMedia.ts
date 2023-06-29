// This state is shared across all player instances so that the same intro/outro
// plays again in any player to keep the experience consistent.

const playedIntroOutroMedia = new Set();

const updatePlayedIntroOutroMedia = (introOutro) => {
  const media = [...(introOutro.audio || []), ...(introOutro.video || [])];
  media.forEach(m => playedIntroOutroMedia.add(m.url));
};

const alreadyPlayedIntroOutroMedia = (introOutro) => {
  const media = [...(introOutro.audio || []), ...(introOutro.video || [])];
  return media.some(m => playedIntroOutroMedia.has(m.url));
};

export default playedIntroOutroMedia;
export { updatePlayedIntroOutroMedia, alreadyPlayedIntroOutroMedia };
