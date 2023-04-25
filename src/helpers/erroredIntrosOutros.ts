const erroredIntrosOutros = { mediaSources: new Set() };

const updateErroredIntrosOutros = (introOutros) => {
  for (const media of introOutros.media) {
    erroredIntrosOutros.mediaSources.add(media.url);
  }
};

const resultedInAPlaybackError = (introOutro) => {
  for (const media of introOutro.media) {
    if (erroredIntrosOutros.mediaSources.has(media.url)) { return true; }
  }

  return false;
};

export default erroredIntrosOutros;
export { updateErroredIntrosOutros, resultedInAPlaybackError };
