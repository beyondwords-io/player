import md5 from "crypto-js/md5";
import matchesXpath from "./matchesXpath";

const chooseSegmentPerPlayer = (target) => {
  const players = BeyondWords.Player.instances();
  const entries = [...players.entries()];

  const segmentPerPlayer = entries.map(([p, player]) => ({ p, player }));
  const playersRemaining = playerIndexesThatHaveSegments(entries);

  // Pass 1: Match on data-beyondwords-marker or xpath and md5 combined.
  let node = target;
  while (node && !isRoot(node)) {
    if (playersRemaining.size === 0 || shouldNotRespondToHoverOrClick(node)) { break; }

    chooseSegmentBy(matchesDataMarker, node, players, segmentPerPlayer, playersRemaining);
    chooseSegmentBy(matchesXpathAndMd5, node, players, segmentPerPlayer, playersRemaining);

    node = node.parentNode;
  }

  // Pass 2: Match on md5 only. This handles the case where the content from the
  // API has a slightly different DOM tree (xpath) than the one on the page.
  node = target;
  while (node && !isRoot(node)) {
    if (playersRemaining.size === 0 || shouldNotRespondToHoverOrClick(node)) { break; }

    chooseSegmentBy(matchesMd5, node, players, segmentPerPlayer, playersRemaining);

    node = node.parentNode;
  }

  setPrecedenceBasedOnPlaybackState(segmentPerPlayer);

  return segmentPerPlayer;
};

const playerIndexesThatHaveSegments = (entries) => {
  const playerIndexes = new Set();

  for (const [p, player] of entries) {
    const hasSegments = player.content.some(c => c.segments?.length);
    if (hasSegments) { playerIndexes.add(p); }
  }

  return playerIndexes;
};

const isRoot = (node) => (
  node === document || node === document.body || node === document.head
);

const shouldNotRespondToHoverOrClick = (node) => {
  if (node.onclick || node.onmousedown) { return true; }

  const nodeName = node.nodeName.toLowerCase();
  return nodeName === "a" || nodeName === "img" || nodeName === "audio";
};

const chooseSegmentBy = (matchFnFn, node, players, segmentPerPlayer, playersRemaining) => {
  if (playersRemaining.size === 0) { return; }

  const matchFn = matchFnFn(node);
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
          if (thisContent === bestContent && segmentPerPlayer[p].segment) { continue; }

          // This segment is the best so far so update the return object.
          bestContent = thisContent;

          segmentPerPlayer[p].segment = segment;
          segmentPerPlayer[p].contentIndex = contentIndex;
          segmentPerPlayer[p].segmentIndex = segmentIndex;
          segmentPerPlayer[p].segmentElement = node;

          playersRemaining.delete(p); // We found a segment for this player.
        }
      }
    }
  }
};

const matchesDataMarker = (node) => {
  const marker = node.getAttribute("data-beyondwords-marker");

  if (marker) {
    return (segment) => segment.marker === marker;
  } else {
    return null; // Avoid iterating remainingPlayers if no marker.
  }
};

const matchesXpathAndMd5 = (node) => {
  const xpath = lazyMemo(() => xpathForNode(node));
  const md5 = lazyMemo(() => textContentMd5(node));

  return (segment) => matchesXpath(segment.xpath, xpath()) && segment.md5 === md5();
};

const matchesMd5 = (node) => {
  const md5 = lazyMemo(() => textContentMd5(node));

  return (segment) => segment.md5 === md5();
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

// If multiple players match the clicked/hovered segment then give each player
// a precedence from 0..N. Otherwise, when you click on a segment, all players
// would try to play the segment and they'd pause each other (a kind of deadlock).
const setPrecedenceBasedOnPlaybackState = (segmentPerPlayer) => {
  const competingPlayers = segmentPerPlayer.filter(o => o.segment);

  competingPlayers.sort((a, b) => {
    // Give higher precedence (a lower score) to players that are playing.
    const score1 = stateScores[a.player.playbackState] || 0;
    const score2 = stateScores[b.player.playbackState] || 0;

    if (score1 > score2) { return -1; }
    if (score1 < score2) { return 1; }

    // If the players are tied on playbackState then give higher precedence to
    // players that are vertically closer to the segmentEelement on the page.
    const elementTop1 = a.segmentElement.getBoundingClientRect().top;
    const elementTop2 = b.segmentElement.getBoundingClientRect().top;

    // The user interface will be undefined if the player is used in headless mode.
    const playerTop1 = a.player.userInterface ? a.player.target.getBoundingClientRect().top : Infinity;
    const playerTop2 = b.player.userInterface ? b.player.target.getBoundingClientRect().top : Infinity;

    const distance1 = Math.abs(elementTop1 - playerTop1);
    const distance2 = Math.abs(elementTop2 - playerTop2);

    if (distance1 < distance2) { return -1; }
    if (distance1 > distance2) { return 1; }

    return 0;
  });

  for (const [rank, object] of competingPlayers.entries()) {
    object.precedence = rank;
  }
};

const stateScores = { playing: 2, paused: 1, stopped: 0 };

export default chooseSegmentPerPlayer;
export { textContentMd5 };
