import { textContentMd5 } from "./chooseSegmentPerPlayer";

// This is the inverse operation of chooseSegmentPerPlayer which takes a target
// element and returns a content item segment.
//
// This function takes a content item segment and tries to find a DOM element on
// the page based on the segment's marker and (xpath, md5) composite key.

const chooseSegmentElement = (segment) => {
  if (!segment) { return; }

  // If we have previously hovered over the element or one of its siblings,
  // return the element that we previously matched based on MD5 only.
  if (segment.matchedElement) { return segment.matchedElement; }

  // If an element is uniquely identified by the marker, return it.
  const markerElements = findAllByMarker(segment.marker);
  if (markerElements.length === 1) { return markerElements[0]; }

  // If no elements were identified by the marker, return the first xpath match.
  const xpathElements = findAllByXpathAndMd5(segment.xpath, segment.md5);
  if (markerElements.length === 0) { return xpathElements[0]; } // Might be undefined.

  // If elements were identified by both identifiers, return the first common element.
  const intersection = markerElements.filter(e => xpathElements.includes(e));
  if (intersection.length !== 0) { return intersection[0]; }

  // If no elements are in common then return the first marker element.
  return markerElements[0]; // Might be undefined.
};

const findAllByMarker = (marker) => {
  if (!marker) { return []; }

  return [...document.querySelectorAll(`[data-beyondwords-marker="${marker}"]`)];
};

const findAllByXpathAndMd5 = (xpath, md5) => {
  if (!xpath || !md5) { return []; }

  const xpathResult = document.evaluate(xpath, document);
  const elements = [];

  for (;;) {
    const element = xpathResult.iterateNext();

    if (element && textContentMd5(element) === md5) {
      elements.push(element);
    } else {
      return elements;
    }
  }
};

export default chooseSegmentElement;
