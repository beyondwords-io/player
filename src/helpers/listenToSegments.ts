import { attribute } from "./highlightSegment";
import newEvent from "./newEvent";

const listenToSegments = () => {
  addEventListener("mousemove", handleMouseMove);
  addEventListener("mousedown", handleMouseDown);
  addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (event) => {
  let hovered = document.elementFromPoint(event.clientX, event.clientY);
  let marker;

  while (hovered && hovered.hasAttribute) {
    marker = hovered.getAttribute(attribute);
    if (marker) { break; }

    hovered = hovered.parentNode;
  }

  // TODO: if multiple players?

  for (const player of BeyondWords.Player.instances()) {
    const { segment, contentIndex, segmentIndex } = chooseSegment(player, marker);

    if (changed(player, contentIndex, segmentIndex)) {
      player.onEvent(newEvent({
        type: "HoveredArticleSegment",
        description: "The user hovered over a segment in the article.",
        initiatedBy: "user",
        segment,
        contentIndex,
        segmentIndex,
      }));
    }
  }
};

let startX, startY;

const handleMouseDown = (event) => {
  startX = event.pageX;
  startY = event.pageY;
};

const handleMouseUp = (event) => {
  const movedX = event.pageX - startX;
  const movedY = event.pageY - startY;
  const moved = Math.sqrt(movedX * movedX + movedY * movedY);

  const isDragged = moved > 5;
  if (isDragged) { return; }

  const isLeftClick = event.button === 0;
  if (!isLeftClick) { return; }

  const marker = event.target.getAttribute(attribute);
  if (!marker) { return; }

  for (const player of BeyondWords.Player.instances()) {
    const { segment, contentIndex, segmentIndex } = chooseSegment(player, marker);
    if (!segment) { continue; }

    // TODO: if multiple players then prefer the one that's playing?

    player.onEvent(newEvent({
      type: "PressedArticleSegment",
      description: "The user pressed on a segment in the article.",
      initiatedBy: "user",
      segment,
      contentIndex,
      segmentIndex,
    }));
  }
};

const chooseSegment = (player, marker) => {
  if (!marker) { return {}; }

  let bestSoFar = {};
  let bestContent = -Infinity;

  for (const [i, content] of (player.content || []).entries()) {
    for (const [j, segment] of (content.segments || []).entries()) {
      if (marker !== segment.marker) { continue; }

      // If the segment appears in the content more than once then choose the first
      // segment that matches the player's contentIndex to avoid changing tracks.
      const thisContent = player.contentIndex === i ? 1 : 0;
      if (thisContent < bestContent) { continue; }

      bestSoFar = { contentIndex: i, segmentIndex: j, segment };
      bestContent = thisContent;
    }
  }

  return bestSoFar;
};

const previousIndexes = {};

const changed = (player, contentIndex, segmentIndex) => {
  previousIndexes[player] ||= {};
  const previous = previousIndexes[player];

  if (previous.contentIndex === contentIndex && previous.segmentIndex === segmentIndex) {
    return false;
  } else {
    previous.contentIndex = contentIndex;
    previous.segmentIndex = segmentIndex;
    return true;
  }
};

listenToSegments();
