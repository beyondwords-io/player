// We take the approach of always retrying if there is a network error, e.g. if
// mobile connectivity drops for a period of time. When connectivity returns the
// audio should coninue playing without the user having to do anything.

const hlsLoadPolicies = () => {
  const retryConfig = {
    maxNumRetry: Infinity,
    retryDelayMs: 10,
    maxRetryDelayMs: 2000,
    backoff: "exponential",
  };

  const loaderConfig = {
    maxTimeToFirstByteMs: Infinity,
    maxLoadTimeMs: 999999999,
    timeoutRetry: retryConfig,
    errorRetry: retryConfig,
  };

  const loadPolicy = {
    default: loaderConfig,
  };

  return {
    fragLoadPolicy: loadPolicy,
    keyLoadPolicy: loadPolicy,
    certLoadPolicy: loadPolicy,
    playlistLoadPolicy: loadPolicy,
    manifestLoadPolicy: loadPolicy,
    steeringManifestLoadPolicy: loadPolicy,
  };
};

export default hlsLoadPolicies;
