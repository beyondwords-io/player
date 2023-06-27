const erroredIntrosOutros = { mediaSources: new Set() };

const updateErroredIntrosOutros = (introOutro) => {
  for (const media of [...introOutro.audio, introOutro.video]) {
    erroredIntrosOutros.mediaSources.add(media.url);
  }
};

const resultedInAPlaybackError = (introOutro) => {
  for (const media of [...introOutro.audio, introOutro.video]) {
    if (erroredIntrosOutros.mediaSources.has(media.url)) { return true; }
  }

  return false;
};

export default erroredIntrosOutros;
export { updateErroredIntrosOutros, resultedInAPlaybackError };
