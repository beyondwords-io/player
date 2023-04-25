const chooseIntroOutro = ({ introsOutros, introsOutrosIndex, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored }) => {
  const currentIntroOutro = introsOutros[introsOutrosIndex];

  if (currentIntroOutro) {
    if (errored) { /* TODO */ }
    if (atTheEnd) { return -1; } // Play the content.
    if (!atTheEnd) { return introsOutrosIndex; } // Keep playing the current intro/outro until it ends.
  }

  if (advertIndex !== -1) { return -1; } // Wait until the advert has finished.

  return atTheStart ? 0 : -1; // TODO: placements
};

export default chooseIntroOutro;
