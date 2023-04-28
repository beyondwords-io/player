import waitUntil from "./waitUntil";
import settableProps from "./settableProps";
import diffObject from "./diffObject";

let previousIndex = -1;
const changedProps = [];

const demonstratePlayer = async (transitions, controller, currentTime) => {
  await waitUntil(() => controller.player);
  const player = controller.player;

  const currentIndex = transitionIndexAtTime(player.contentIndex, currentTime, transitions);

  if (currentIndex > previousIndex) { applyTransitions(player, previousIndex, currentIndex, transitions); }
  if (currentIndex < previousIndex) { undoTransitions(player, previousIndex, currentIndex); }

  previousIndex = currentIndex;
};

const transitionIndexAtTime = (i, time, transitions) => {
  const nextIndex = transitions.findIndex(t => t.index === i && t.atTime > time || t.index > i);
  const afterTheEnd = nextIndex === -1;

  if (afterTheEnd) {
    return transitions.length - 1;
  } else {
    return nextIndex - 1;
  }
};

const applyTransitions = (player, previousIndex, currentIndex, transitions) => {
  for (let i = previousIndex + 1; i <= currentIndex; i += 1) {
    const before = settableProps(player);

    transitions[i].apply(player);
    const after = settableProps(player);

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

export default demonstratePlayer;
