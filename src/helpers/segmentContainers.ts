import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import { safelyRemoveClasses } from "./segmentClickables";

const containerClasses = (id, p, s) => ["beyondwords-widget", "bwp", `id-${id}`, `position-${p}`, `for-${s}-player`];
const relativeClasses = ["beyondwords-relative", "bwp"]; // Also set by SegmentClickables.

class SegmentContainers {
  static #mediator = new OwnershipMediator(this.#addContainers, this.#removeContainers);

  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.containers = [];
    this.ids = new SegmentIdGenerator();
  }

  update(maybeSegment, sections, position, playerStyle) {
    const sticky = sections.includes("all") || sections.includes("body");
    const segment = maybeSegment || sticky && this.previous;

    const previous = this.previous;
    const current = this.ids.fetchOrAdd(segment);

    if (current) { SegmentContainers.#mediator.addInterest(current, this, this, segment, position, playerStyle); }
    if (previous) { SegmentContainers.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  reset() {
    this.update(null, "none");
  }

  static #addContainers(uniqueId, self, segment, position, playerStyle) {
    const element = self.#containerElement(segment);

    // Don't add 'position: relative' to the segmentelement if we can help it to
    // reduce possible styling side-effects on the publisher's webpage.
    const needsRelative = ["2-oclock", "3-oclock", "4-oclock", "8-oclock", "9-oclock", "10-oclock"].includes(position);
    if (needsRelative) { element.classList.add(...relativeClasses); }

    const container = document.createElement("div");
    container.classList.add(...containerClasses(uniqueId, position, playerStyle));

    const insertBefore = ["11-oclock", "12-oclock", "1-oclock"].includes(position);

    if (insertBefore) {
      element.insertBefore(container, element.firstChild);
    } else {
      element.appendChild(container);
    }

    self.containers.push(container);
    self.onUpdate(self.containers);
  }

  static #removeContainers(uniqueId, self, _segment, position, playerStyle) {
    const classes = containerClasses(uniqueId, position, playerStyle);

    for (let i = 0; i < self.containers.length; i += 1) {
      const isMatch = classes.every(c => self.containers[i].classList.contains(c));
      if (!isMatch) { continue; }

      const element = self.containers[i].parentNode;
      safelyRemoveClasses(element, relativeClasses);

      self.containers[i].remove();
      self.containers.splice(i, 1);

      i -= 1;
    }

    self.onUpdate(self.containers);
  }

  // Add the container next to the first DOM node that matches the segment's
  // marker. There might be an edge case where the segment was matched using
  // (xpath, md5) and the marker set on the DOM node does not match the one from
  // the API. In this case, pool all of the elements together and add the
  // container next to the first one on the page. If there are no markers on the
  // page for the segment then add the container next to the segmentElement.
  #containerElement(segment) {
    const marker1 = segment.marker;
    const marker2 = segment.segmentElement?.getAttribute("data-beyondwords-marker");

    let markerElements;

    if (marker1 || marker2) {
      const query1 = marker1 && `[data-beyondwords-marker="${marker1}"]`;
      const query2 = marker2 && `[data-beyondwords-marker="${marker2}"]`;

      const queries = [query1, query2].filter(q => q).join(", ");
      markerElements = document.querySelectorAll(queries);
    }

    if (markerElements.length > 0) {
      return markerElements[0];
    } else {
      return segment.segmentElement;
    }
  }
}

export default SegmentContainers;
