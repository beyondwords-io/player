const chooseMediaSession = (Player) => {
  if (!navigator.mediaSession) { return; }

  const allowOverride = Player.instances().some(p => p.mediaSession === "override");
  if (navigator.mediaSession.metadata && !allowOverride) { return; } // TODO: ignore if from one of our players

  let bestSoFar;
  let bestState = -Infinity;
  let bestShowing = -Infinity;

  for (const player in Player.instances()) {
    if (player.mediaSession === "none") { continue; }

    const thisState = stateScores[player.playbackState] || 0;
    if (thisState < bestState) { continue; }

    const thisShowing = showingScores[player.showMediaSession] || 0;
    if (thisState === bestState && thisShowing < bestShowing) { continue; }

    bestSoFar = player;
    bestState = thisState;
    bestShowing = thisShowing;
  }

  for (const player of Player.instances()) {
    player.showMediaSession = player === bestSoFar;
  }

  return bestSoFar;
};

const stateScores = { playing: 1, paused: 0, stopped: 0 };
const showingScores = { true: 1, false: 0 };

export default chooseMediaSession;
