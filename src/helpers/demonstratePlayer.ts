import waitUntil from "./waitUntil";
import settableProps from "./settableProps";
import diffObject from "./diffObject";

let previousIndex = -1;
const changedProps = [];

const demonstratePlayer = async (controller, currentTime) => {
  await waitUntil(() => controller.player);
  const player = controller.player;

  const currentIndex = transitionIndexAtTime(player.contentIndex, currentTime);

  if (currentIndex > previousIndex) { applyTransitions(player, previousIndex, currentIndex); }
  if (currentIndex < previousIndex) { undoTransitions(player, previousIndex, currentIndex); }

  previousIndex = currentIndex;
};

const transitionIndexAtTime = (i, time) => {
  const nextIndex = transitions.findIndex(t => t.index === i && t.atTime > time || t.index > i);
  const afterTheEnd = nextIndex === -1;

  if (afterTheEnd) {
    return transitions.length - 1;
  } else {
    return nextIndex - 1;
  }
};

const applyTransitions = (player, previousIndex, currentIndex) => {
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

const transitions = [
  { index: 1, atTime: 8.873,  apply: (p) => { p.playerStyle = "small";    p.widgetStyle = "small"; } },
  { index: 1, atTime: 24.713, apply: (p) => { p.playerStyle = "standard"; p.widgetStyle = "standard"; } },
  { index: 1, atTime: 35,     apply: (p) => { p.widgetWidth = "0"; } },
  { index: 1, atTime: 40.768, apply: (p) => { p.playerStyle = "large";    p.widgetStyle = "large"; } },
  { index: 1, atTime: 56.512, apply: (p) => { p.playerStyle = "screen";   p.widgetStyle = "screen"; } },
  { index: 1, atTime: 72.664, apply: (p) => { p.playerStyle = "video";    p.widgetStyle = "video"; } },
];

export default demonstratePlayer;
