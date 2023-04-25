const chooseIntroOutro = ({ introsOutros, introsOutrosIndex, advertIndex, atTheStart, atTheEnd, errored }) => {
  const currentIntroOutro = introsOutros[introsOutrosIndex];

  if (currentIntroOutro) {
    if (errored) { /* TODO */ }
    if (atTheEnd) { return -1; } // Play the content.
    if (!atTheEnd) { return introsOutrosIndex; } // Keep playing the current intro/outro until it ends.
  }

  if (advertIndex !== -1) { return -1; } // Wait until the advert has finished.

  return 0;
};

export default chooseIntroOutro;
