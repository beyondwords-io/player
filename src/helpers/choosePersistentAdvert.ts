import { resultedInAPlaybackError } from "./erroredAdverts";

const choosePersistentAdvert = (persistentAdImage, persistentIndex, advertIndex, adverts) => {
  let bestSoFar = -1;
  let bestMatch = -Infinity;
  let bestPlacement = -Infinity;

  for (const [thisIndex, advert] of adverts.entries()) {
    if (!persistentAdImage) { continue; }
    if (resultedInAPlaybackError(advert)) { continue; }
    if (advert.type === "vast") { continue; }

    const thisMatch = matchScore(thisIndex, persistentIndex, advertIndex);
    if (thisMatch < bestMatch) { continue; }

    const thisPlacement = placementScores[advert.placement] || 0;
    if (thisMatch === bestMatch && thisPlacement < bestPlacement) { continue; }

    bestSoFar = thisIndex;
    bestMatch = thisMatch;
    bestPlacement = thisPlacement;
  }

  return bestSoFar;
};

const placementScores = { "pre-roll": 2, "mid-roll": 1 };

const matchScore = (thisIndex, persistentIndex, advertIndex) => {
  if (thisIndex === advertIndex) { return 2; }
  if (thisIndex === persistentIndex) { return 1; }

  return 0;
};

export default choosePersistentAdvert;
