import md5 from "crypto-js/md5";

const chooseSegmentPerPlayer = (target) => {
  const players = BeyondWords.Player.instances();
  const entries = [...players.entries()];

  const segmentPerPlayer = entries.map(([p, player]) => ({ p, player }));
  const playersRemaining = playerIndexesThatHaveSegments(entries);

  while (target && !isRoot(target)) {
    if (playersRemaining.size === 0) { break; }
    if (shouldNotRespondToHoverOrClick(target)) { break; }

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

const shouldNotRespondToHoverOrClick = (target) => {
  if (target.onclick || target.onmousedown) { return true; }

  const nodeName = target.nodeName.toLowerCase();
  return nodeName === "a" || nodeName === "img" || nodeName === "audio";
};

const chooseSegmentBy = (matchFnFn, target, players, segmentPerPlayer, playersRemaining) => {
  if (playersRemaining.size === 0) { return; }

  const matchFn = matchFnFn(target);
  if (!matchFn) { return; }

  for (const p of playersRemaining) {
    let bestContent = -Infinity;

    for (const [contentIndex, contentItem] of players[p].content.entries()) {
      for (const [segmentIndex, segment] of contentItem.segments.entries()) {
        if (matchFn(segment)) {
          // If the segment appears in the content more than once then choose the first
          // segment that matches the player's contentIndex to avoid changing tracks.
          const thisContent = players[p].contentIndex === contentIndex ? 1 : 0;
          if (thisContent < bestContent) { continue; }

          // If the marker appears in the segments more than once then choose the first
          // segment so that playback starts from the earliest segment.
          if (thisContent === bestContent && bestSoFar?.segment) { continue; }

          // This segment is the best so far so update the return object.
          bestContent = thisContent;

          segmentPerPlayer[p].segment = segment;
          segmentPerPlayer[p].contentIndex = contentIndex;
          segmentPerPlayer[p].segmentIndex = segmentIndex;
          segmentPerPlayer[p].segmentElement = target;

          playersRemaining.delete(p); // We found a segment for this player.
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
};

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
  };
};

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

const md5Cache = new WeakMap();

const textContentMd5 = (node) => {
  if (md5Cache.has(node)) { return md5Cache.get(node); }

  let textContent = node.textContent?.replaceAll(/\s+/g, " ")?.trim();

  // The MD5 for image and audio segments should be empty_string_hexdigest.
  if (!textContent || textContent === " ") { textContent = ""; }

  md5Cache.set(node, md5(textContent).toString());

  return md5Cache.get(node);
};

export default chooseSegmentPerPlayer;
export { textContentMd5 };
