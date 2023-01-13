import { knownInterfaceStyle } from "./interfaceStyles";

const chooseWidget = (Player) => {
  let somePlayerIsVisible = false;

  let bestSoFar;
  let bestState = -Infinity;
  let bestY = -Infinity;

  for (const player of Player.instances()) {
    if (!player.userInterface) { continue; }

    const knownStyle = knownInterfaceStyle(player.widgetStyle);
    if (!knownStyle) { continue; }

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
    player.showWidgetAtBottom = player === bestSoFar;
  }
};

const stateScores = { playing: 2, paused: 1 };

export default chooseWidget;
