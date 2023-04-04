const attribute = "data-beyondwords-marker";
const markClasses = ["beyondwords-highlight", "bwp"];
const markerClasses = ["beyondwords-clickable", "bwp"];

const highlightSegments = (currentSegment, hoveredSegment, highlightColor, segmentPlayback, segmentHighlight) => {
  const currentEnabled = playbackEnabled(currentSegment, segmentPlayback);
  const hoveredEnabled = playbackEnabled(hoveredSegment, segmentPlayback);

  const highlightCurrent = ["both", "current"].includes(segmentHighlight) || segmentHighlight === "auto" && currentEnabled;
  const highlightHovered = ["both", "hovered"].includes(segmentHighlight) || segmentHighlight === "auto" && hoveredEnabled;

  highlightSegment(highlightCurrent && currentSegment, "current-segment", highlightColor);
  highlightSegment(highlightHovered && hoveredSegment, "hovered-segment", highlightColor, hoveredEnabled);
};

const playbackEnabled = (segment, segmentPlayback) => (
  segment?.section === "body" && segmentPlayback === "body" || segmentPlayback === "auto"
);

const highlightSegment = (segment, className, background, setMarkerClasses) => {
  const markersToHighlight = new Set(findMarkers(segment));
  const markersToUnhighlight = findAllMarkers().filter(m => !markersToHighlight.has(m));

  highlight(markersToHighlight, className, background, setMarkerClasses);
  unhighlight(markersToUnhighlight, className);
};

const highlight = (markers, className, background, setMarkerClasses) => {
  for (const marker of markers) {
    const mark = findInnerMark(marker) || createInnerMark(marker);

    mark.classList.add(className);
    mark.style.background = background;

    moveChildren({ fromElement: marker, toElement: mark });

    if (setMarkerClasses) {
      markerClasses.forEach(name => marker.classList.add(name));
    }
  }
};

const unhighlight = (markers, className) => {
  const classNames = new Set([...markClasses, className]);

  for (const marker of markers) {
    const mark = findInnerMark(marker);

    if (hasOtherHighlights(mark, classNames)) {
      mark.classList.remove(className);
    } else if (mark) {
      moveChildren({ fromElement: mark, toElement: marker });
      mark.remove();
      markerClasses.forEach(name => marker.classList.remove(name));
    }
  }
};

const findAllMarkers = () => (
  [...document.querySelectorAll(`[${attribute}]`)]
);

const findMarkers = (segment) => {
  if (!segment?.marker) { return []; }
  return document.querySelectorAll(`[${attribute}="${segment.marker}"]`);
};

const findInnerMark = (element) => (
  element.querySelector(`mark.${markClasses.join(".")}`)
);

const createInnerMark = (element) => {
  const mark = document.createElement("mark");

  mark.classList.add(...markClasses);
  element.appendChild(mark);

  return mark;
};

const hasOtherHighlights = (mark, classNames) => {
  if (!mark) { return false; }

  for (const className of mark.classList) {
    if (!classNames.has(className)) { return true; }
  }
};

const moveChildren = ({ fromElement, toElement }) => {
  for (let i = 0; i < fromElement.childNodes.length; i += 1) {
    const child = fromElement.childNodes[i];
    if (child === toElement) { continue; }

    toElement.appendChild(child);
    i -= 1;
  }
};

export default highlightSegments;
export { attribute };
