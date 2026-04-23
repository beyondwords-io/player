import { updateErroredIntrosOutros, resultedInAPlaybackError } from "./erroredIntrosOutros";
import { updatePlayedIntroOutroMedia, alreadyPlayedIntroOutroMedia } from "./playedIntroOutroMedia";

const chooseIntroOutro = ({ introsOutros = [], introsOutrosIndex, advertIndex, content, contentIndex, outroPlaybackMode, currentTime, atTheStart, atTheEnd, errored }) => {
  const currentIntroOutro = introsOutros[introsOutrosIndex];

  x: if (currentIntroOutro) {
    if (errored) { updateErroredIntrosOutros(currentIntroOutro); break x; } // Choose another intro/outro.
    if (atTheEnd) { updatePlayedIntroOutroMedia(currentIntroOutro); return -1; } // Play the advert/content.
    if (!atTheEnd) { return introsOutrosIndex; } // Keep playing the current intro/outro until it ends.
  }

  if (advertIndex !== -1) { return -1; } // Wait until the advert has finished.

  const placements = placementsThatCanPlay({ content, contentIndex, outroPlaybackMode, currentTime, atTheStart, atTheEnd });

  const currentContentId = content[contentIndex]?.id;

  let bestSoFar = -1;
  let bestContentMatch = -Infinity;
  let bestPlayed = -Infinity;
  let bestRandom = -Infinity;

  for (const [thisIndex, introOutro] of introsOutros.entries()) {
    if (resultedInAPlaybackError(introOutro)) { continue; }
    if (!placements.has(introOutro.placement)) { continue; }

    const thisContentMatch = introOutro.contentId === undefined ? 1 : introOutro.contentId === currentContentId ? 2 : 0;
    if (thisContentMatch === 0) { continue; }
    if (thisContentMatch < bestContentMatch) { continue; }

    const thisPlayed = alreadyPlayedIntroOutroMedia(introOutro) ? 1 : 0;
    if (thisContentMatch === bestContentMatch && thisPlayed < bestPlayed) { continue; }

    const thisRandom = Math.random();
    if (thisContentMatch === bestContentMatch && thisPlayed === bestPlayed && thisRandom < bestRandom) { continue; }

    bestSoFar = thisIndex;
    bestContentMatch = thisContentMatch;
    bestPlayed = thisPlayed;
    bestRandom = thisRandom;
  }

  return bestSoFar;
};

const placementsThatCanPlay = ({ content, contentIndex, outroPlaybackMode, currentTime, atTheStart, atTheEnd }) => {
  const eligiblePlacements = new Set();

  const atTheStartOfAllContent = atTheStart && contentIndex === 0 && currentTime === 0;
  const atTheEndOfAllContent = atTheEnd && contentIndex === content.length - 1;

  if (atTheStartOfAllContent) { eligiblePlacements.add("pre-roll"); }
  if (atTheEndOfAllContent) { eligiblePlacements.add("post-roll"); }
  if (outroPlaybackMode === "after-each" && atTheEnd) { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
};

export default chooseIntroOutro;
