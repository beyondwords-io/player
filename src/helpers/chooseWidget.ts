import { knownPlayerStyle } from "./playerStyles";
import { knownContentVariant } from "./contentVariants";

const chooseWidget = (Player) => {
  let somePlayerIsVisible = false;

  let bestSoFar;
  let bestState = -Infinity;
  let bestY = -Infinity;

  for (const player of Player.instances()) {
    if (!player.userInterface) { continue; }

    const knownStyle = knownPlayerStyle(player.widgetStyle);
    if (!knownStyle) { continue; }

    const knownVariant = knownContentVariant(player.contentVariant);
    if (!knownVariant) { continue; }

    const withinViewport = player.userInterface.isVisible;
    if (withinViewport) { somePlayerIsVisible = true; continue; }

    const aboveViewport = player.userInterface.relativeY < 0;
    if (!aboveViewport) { continue; }

    const thisState = stateScores[player.playbackState] || 0;
    if (thisState < bestState) { continue; }

    const thisY = player.userInterface.absoluteY;
    if (thisState === bestState && thisY < bestY) { continue; }

    bestSoFar = player;
    bestState = thisState;
    bestY = thisY;
  }

  if (somePlayerIsVisible && bestState === 0) {
    bestSoFar = null;
  }

  for (const player of Player.instances()) {
    player.showBottomWidget = player === bestSoFar;
  }
};

const stateScores = { playing: 2, paused: 1, stopped: 0 };

export default chooseWidget;
