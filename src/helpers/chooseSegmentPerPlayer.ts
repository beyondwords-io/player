import md5 from "crypto-js/md5";

const chooseSegmentPerPlayer = (target) => {
  const players = BeyondWords.Player.instances();
  const entries = [...players.entries()];

  const segmentPerPlayer = entries.map(([p, player]) => ({ p, player }));
  const playersRemaining = playerIndexesThatHaveSegments(entries);

  while (target && !isRoot(target)) {
    if (playersRemaining.size === 0) { break; }
    if (target.onclick || target.onmousedown) { break; }
    if (target.nodeName.toLowerCase() === "a") { break; }
    if (target.nodeName.toLowerCase() === "img") { break; }

    chooseSegmentBy("marker", dataMarker, target, players, segmentPerPlayer, playersRemaining);
    chooseSegmentBy("xpath", xpathForNode, target, players, segmentPerPlayer, playersRemaining);
    chooseSegmentBy("md5", textContentMd5, target, players, segmentPerPlayer, playersRemaining);

    target = target.parentNode;
  }

  // TODO: add precedence based on playing, etc.

  return segmentPerPlayer;
};

const playerIndexesThatHaveSegments = (entries) => {
  const playerIndexes = new Set();

  for (const [p, player] of entries) {
    const hasSegments = player.content.some(c => c.segments.length);
    if (hasSegments) { playerIndexes.add(p); }
  }

  return playerIndexes;
};

const isRoot = (target) => (
  target === document || target === document.body || target === document.head
);

const chooseSegmentBy = (key, lookupFn, target, players, segmentPerPlayer, playersRemaining) => {
  if (playersRemaining.size === 0) { return; }

  const value = lookupFn(target);
  if (!value) { return; }

  outerPlayerLoop: for (const p of playersRemaining) {
    // TODO: implement this logic: https://github.com/beyondwords-io/player/blob/c0c8dc5f137e79ebc22efb3931f88d24e6a636a5/src/helpers/listenToSegments.ts#L90C1-L97

    for (const [contentIndex, contentItem] of players[p].content.entries()) {
      for (const [segmentIndex, segment] of contentItem.segments.entries()) {
        if (segment[key] === value) {
          segmentPerPlayer[p].segment = segment;
          segmentPerPlayer[p].contentIndex = contentIndex;
          segmentPerPlayer[p].segmentIndex = segmentIndex;
          segmentPerPlayer[p].segmentElement = target;

          playersRemaining.delete(p);
          continue outerPlayerLoop;
        }
      }
    }
  }
};

const dataMarker = (node) => (
  node.getAttribute("data-beyondwords-marker")
);

const xpathForNode = (node) => {
  const parent = node?.parentNode;
  if (!node || !parent) { return ""; }

  const tagName = node.nodeName.toLowerCase();
  const siblings = [...parent.children].filter(n => n.nodeName.toLowerCase() === tagName);
  const isUnique = siblings.length === 1;

  if (isUnique) {
    return `${xpathForNode(parent)}/${tagName}`;
  } else {
    return `${xpathForNode(parent)}/${tagName}[${siblings.indexOf(node) + 1}]`;
  }
};

const md5Cache = {};

const textContentMd5 = (node) => {
  if (node in md5Cache) { return md5Cache[node]; }

  const textContent = node.textContent?.replaceAll(/\s+/g, " ")?.trim();
  const hasContent = textContent && textContent !== " ";

  if (hasContent) {
    md5Cache[node] = md5(textContent).toString();
  } else {
    md5Cache[node] = null;
  }

  return md5Cache[node];
};

export default chooseSegmentPerPlayer;
