const attribute = "data-beyondwords-marker";
const markClass = "beyondwords-highlight";

const highlightSegment = (segment, className) => {
  // TODO: remove previous higlight

  const markers = findMarkers(segment);

  for (const marker of markers) {
    const mark = findInnerMark(marker) || createInnerMark(marker);

    mark.classList.add(className);
    moveChildren({ fromElement: marker, toElement: mark });
  }
};

const findMarkers = (segment) => {
  if (!segment?.marker) { return []; }
  return document.querySelectorAll(`[${attribute}="${segment.marker}"]`);
};

const findInnerMark = (element) => (
  element.querySelector(`mark.${markClass}`)
);

const createInnerMark = (element) => {
  const mark = document.createElement("mark");

  mark.classList.add(markClass, "bwp");
  element.appendChild(mark);

  return mark;
};

const moveChildren = ({ fromElement, toElement }) => {
  for (let i = 0; i < fromElement.childNodes.length; i += 1) {
    const child = fromElement.childNodes[i];
    if (child === toElement) { continue; }

    toElement.appendChild(child);
    i -= 1;
  };
};

export default highlightSegment;
