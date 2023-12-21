import waitUntil from "./waitUntil";
import diffObject from "./diffObject";

// TODO: move state onto player (or into controller?) so that you can use transitions with multiple player instances.
let previousIndex = -1;
const changedProps = [];

const applyTransitions = async (transitions, controller, currentTime) => {
  await waitUntil(() => controller.player);
  const player = controller.player;

  const currentIndex = transitionIndexAtTime(player.contentIndex, currentTime, transitions);

  if (currentIndex > previousIndex) { callTransitions(player, previousIndex, currentIndex, transitions); }
  if (currentIndex < previousIndex) { undoTransitions(player, previousIndex, currentIndex); }

  previousIndex = currentIndex;
};

const transitionIndexAtTime = (i, time, transitions) => {
  const nextIndex = transitions.findIndex(t => t[0] === i && t[1] > time || t[0] > i);
  const afterTheEnd = nextIndex === -1;

  if (afterTheEnd) {
    return transitions.length - 1;
  } else {
    return nextIndex - 1;
  }
};

const callTransitions = (player, previousIndex, currentIndex, transitions) => {
  for (let i = previousIndex + 1; i <= currentIndex; i += 1) {
    const before = player.properties();

    transitions[i][2](player);
    const after = player.properties();

    const diff = diffObject(before, after);
    changedProps.push(diff);
  }
};

const undoTransitions = (player, previousIndex, currentIndex) => {
  for (let i = previousIndex; i > currentIndex; i -= 1) {
    const diff = changedProps.pop();

    for (const [key, delta] of Object.entries(diff)) {
      player[key] = delta.previousValue;
    }
  }
};

export default applyTransitions;
