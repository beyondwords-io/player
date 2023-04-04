import { attribute } from "./highlightSegment";
import newEvent from "./newEvent";

const listenToSegments = () => {
  addEventListener("mousemove", handleMouseMove);
  addEventListener("mousedown", handleMouseDown);
  addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (event) => {
  // TODO
};

const handleMouseDown = (event) => {
  startX = event.pageX;
  startY = event.pageY;
}

const handleMouseUp = (event) => {
  if (mouseDragged(event)) { return; }
  if (event.button !== 0) { return; }

  const markersClicked = new Set(findClickedMarkers(event.target));
  if (markersClicked.size === 0) { return; }

  eachSegment(({ segment, player, contentIndex, segmentIndex }) => {
    if (!markersClicked.has(segment.marker)) { return; }

    // TODO: if multiple players then prefer the one that's playing?

    player.onEvent(newEvent({
      type: "PressedArticleSegment",
      description: "The user pressed on a segment in the article.",
      initiatedBy: "user",
      contentIndex,
      segmentIndex,
      segment,
    }));
  });
};

let startX, startY;

const mouseDragged = (event) => {
  const movedX = event.pageX - startX;
  const movedY = event.pageY - startY;

  const moved = Math.sqrt(movedX * movedX + movedY * movedY);
  return moved > 5;
};

const findClickedMarkers = (target) => {
  const markers = [];

  while (target && target.hasAttribute) {
    markers.push(target.getAttribute(attribute));
    target = target.parentNode;
  }

  return markers.filter(m => m);
};

const eachSegment = (callback) => {
  for (const player of BeyondWords.Player.instances()) {
    for (const [i, content] of (player.content || []).entries()) {
      for (const [j, segment] of (content.segments || []).entries()) {
        callback({ player, contentIndex: i, segmentIndex: j, segment });
      }
    }
  }
};

listenToSegments();
