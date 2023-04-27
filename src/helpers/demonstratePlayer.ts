import waitUntil from "../helpers/waitUntil";

let previousIndex = -1;

const demonstratePlayer = async (controller, currentTime) => {
  await waitUntil(() => controller.player);
  const player = controller.player;

  const currentIndex = transitionIndexAtTime(player.contentIndex, player.currentTime);
  if (currentIndex === previousIndex) { return; }

  transitions[currentIndex].apply(player);
  // TODO: apply/revert multiple transitions

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

const transitions = [
  { index: 1, atTime: 8.873,  apply: (p) => { p.playerStyle = "small";    p.widgetStyle = "small"; } },
  { index: 1, atTime: 24.713, apply: (p) => { p.playerStyle = "standard"; p.widgetStyle = "standard"; } },
  { index: 1, atTime: 40.768, apply: (p) => { p.playerStyle = "large";    p.widgetStyle = "large"; } },
  { index: 1, atTime: 56.512, apply: (p) => { p.playerStyle = "screen";   p.widgetStyle = "screen"; } },
  { index: 1, atTime: 72.664, apply: (p) => { p.playerStyle = "video";    p.widgetStyle = "video"; } },
];

export default demonstratePlayer;
