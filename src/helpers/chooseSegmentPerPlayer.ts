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

    chooseSegmentBy(matchesDataMarker, target, players, segmentPerPlayer, playersRemaining);
    chooseSegmentBy(matchesXpathAndMd5, target, players, segmentPerPlayer, playersRemaining);

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

const chooseSegmentBy = (matchFnFn, target, players, segmentPerPlayer, playersRemaining) => {
  if (playersRemaining.size === 0) { return; }

  const matchFn = matchFnFn(target);
  if (!matchFn) { return; }

  outerPlayerLoop: for (const p of playersRemaining) {
    // TODO: implement this logic: https://github.com/beyondwords-io/player/blob/c0c8dc5f137e79ebc22efb3931f88d24e6a636a5/src/helpers/listenToSegments.ts#L90C1-L97

    for (const [contentIndex, contentItem] of players[p].content.entries()) {
      for (const [segmentIndex, segment] of contentItem.segments.entries()) {
        if (matchFn(segment)) {
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

const matchesDataMarker = (target) => {
  const marker = target.getAttribute("data-beyondwords-marker");

  if (marker) {
    return (segment) => segment.marker === marker;
  } else {
    return null; // Avoid iterating remainingPlayers if no marker.
  }
}

const matchesXpathAndMd5 = (target) => {
  const xpath = lazyMemo(() => xpathForNode(target));
  const md5 = lazyMemo(() => textContentMd5(target));

  return (segment) => segment.xpath === xpath() && segment.md5 === md5();
};

const lazyMemo = (valueFn) => {
  let value, called;

  return () => {
    if (!called) { value = valueFn(); called = true; }
    return value;
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
