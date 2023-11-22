import chooseSegmentPerPlayer from "./chooseSegmentPerPlayer";
import newEvent from "./newEvent";

let listening = false;

const listenToSegments = () => {
  if (listening) { return; }

  addEventListener("mousedown", handleMouseDown);
  addEventListener("click", handleClick);
  addEventListener("mousemove", handleMouseMove);

  listening = true;
};

let mouseDownX, mouseDownY;

const handleMouseDown = (event) => {
  mouseDownX = event.pageX;
  mouseDownY = event.pageY;
};

const mouseWasDragged = (event) => {
  const movedX = event.pageX - mouseDownX;
  const movedY = event.pageY - mouseDownY;

  const moved = Math.sqrt(movedX * movedX + movedY * movedY);
  return moved > 5;
};

const handleClick = (event) => {
  if (event.defaultPrevented) { return; }
  if (mouseWasDragged(event)) { return; }
  if (event.button !== 0) { return; }

  for (const { player, segment, contentIndex, segmentIndex, segmentElement, precedence } of chooseSegmentPerPlayer(event.target)) {
    if (!segment) { continue; }

    player.onEvent(newEvent({
      type: "PressedSegment",
      description: "The user pressed on a segment in the article.",
      initiatedBy: "user",
      emittedFrom: "segment",
      segment,
      contentIndex,
      segmentIndex,
      segmentElement,
      precedence,
    }));
  }
};

const handleMouseMove = (event) => {
  for (const { p, player, segment, contentIndex, segmentIndex, segmentElement, precedence } of chooseSegmentPerPlayer(event.target)) {
    if (!hoveredChanged(p, contentIndex, segmentIndex)) { continue; }

    player.onEvent(newEvent({
      type: "HoveredSegmentUpdated",
      description: "The user hovered over a different segment in the article.",
      initiatedBy: "user",
      emittedFrom: "segment",
      segment,
      contentIndex,
      segmentIndex,
      segmentElement,
      precedence,
    }));
  }
};

const hoveredIndexes = {};

const hoveredChanged = (playerIndex, contentIndex, segmentIndex) => {
  hoveredIndexes[playerIndex] ||= {};
  const previous = hoveredIndexes[playerIndex];

  if (previous.contentIndex === contentIndex && previous.segmentIndex === segmentIndex) {
    return false;
  } else {
    previous.contentIndex = contentIndex;
    previous.segmentIndex = segmentIndex;
    return true;
  }
};

export default listenToSegments;
