const chooseIntroOutro = ({ introsOutros, introsOutrosIndex, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored }) => {
  const currentIntroOutro = introsOutros[introsOutrosIndex];

  x: if (currentIntroOutro) {
    if (errored) { updateErroredIntrosOutros(currentIntroOutro); break x; } // Choose another intro/outro.
    if (atTheEnd) { updatePlayedIntroOutroMedia(currentIntroOutro); return -1; } // Play the content.
    if (!atTheEnd) { return introsOutrosIndex; } // Keep playing the current intro/outro until it ends.
  }

  if (advertIndex !== -1) { return -1; } // Wait until the advert has finished.

  const placements = placementsThatCanPlay({ content, contentIndex, currentTime, atTheStart, atTheEnd });

  return atTheStart ? 0 : -1; // TODO: placements
};

const updateErroredIntrosOutros = () => {}; // TODO
const updatePlayedIntroOutroMedia = () => {}; // TODO

const placementsThatCanPlay = ({ content, contentIndex, currentTime, atTheStart, atTheEnd }) => {
  const eligiblePlacements = new Set();

  const atTheStartOfAllContent = atTheStart && contentIndex === 0 && currentTime === 0;
  const atTheEndOfAllContent = atTheEnd && contentIndex === content.length - 1;

  if (atTheStartOfAllContent) { eligiblePlacements.add("pre-roll"); }
  if (atTheEndOfAllContent) { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
};

export default chooseIntroOutro;
