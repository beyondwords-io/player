import { attribute } from "./highlightSegments";
import newEvent from "./newEvent";

const listenToSegments = () => {
  addEventListener("mousedown", handleMouseDown);
  addEventListener("click", handleMouseUp);
  addEventListener("mousemove", handleMouseMove);
};

const handleMouseDown = (event) => {
  startX = event.pageX;
  startY = event.pageY;
};

const handleMouseUp = (event) => {
  if (event.defaultPrevented) { return; }
  if (draggedMouse(event)) { return; }
  if (event.button !== 0) { return; }

  const marker = markerElement(event.target)?.getAttribute(attribute);
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

const handleMouseMove = (event) => {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const marker = markerElement(target)?.getAttribute(attribute);

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

const markerElement = (target) => {
  while (target && target.hasAttribute) {
    if (target.hasAttribute(attribute)) { return target; }

    if (target.onclick || target.onmousedown) { return; }
    if (target.nodeName.toLowerCase() === "a") { return; }

    target = target.parentNode;
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

let startX, startY;

const draggedMouse = (event) => {
  const movedX = event.pageX - startX;
  const movedY = event.pageY - startY;

  const moved = Math.sqrt(movedX * movedX + movedY * movedY);
  return moved > 5;
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
