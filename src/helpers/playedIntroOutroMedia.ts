// This state is shared across all player instances so that the same intro/outro
// plays again in any player to keep the experience consistent.

const playedIntroOutroMedia = new Set();

const updatePlayedIntroOutroMedia = (introOutro) => {
  introOutro.media.forEach(m => playedIntroOutroMedia.add(m.url));
};

const alreadyPlayedIntroOutroMedia = (introOutro) => (
  introOutro.media.some(m => playedIntroOutroMedia.has(m.url))
);

export default playedIntroOutroMedia;
export { updatePlayedIntroOutroMedia, alreadyPlayedIntroOutroMedia };
