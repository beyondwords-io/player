import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";

const clickableClasses = ["beyondwords-clickable", "bwp"]; // Also set by SegmentContainers.

// This class only adds/removes a className to show 'cursor: pointer' when hovering.
// An event is always emitted when you click on a segment and RootController
// decides whether to act on it by checking if its section is in clickableSections.

class SegmentClickables {
  static #mediator = new OwnershipMediator(this.#addClasses, this.#removeClasses);

  constructor() {
    this.ids = new SegmentIdGenerator();
  }

  update(segment, sections) {
    const enabled = sectionEnabled("hovered", segment, sections);

    const previous = this.previous;
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    if (current) { SegmentClickables.#mediator.addInterest(current, this, segment); }
    if (previous) { SegmentClickables.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  static #addClasses(_uniqueId, segment) {
    segment.segmentElement.classList.add(...clickableClasses);
    if (!segment.marker) { return; }

    const markerElements = document.querySelectorAll(`[data-beyondwords-marker="${segment.marker}"]`);
    for (const element of markerElements) { element.classList.add(...clickableClasses); }
  }

  static #removeClasses(_uniqueId, segment) {
    safelyRemoveClasses(segment.segmentElement, clickableClasses);
    if (!segment.marker) { return; }

    const markerElements = document.querySelectorAll(`[data-beyondwords-marker="${segment.marker}"]`);
    for (const element of markerElements) { safelyRemoveClasses(element, clickableClasses); }
  }
}

// Remove all classes but leave the .bwp in place if there are other .beyondwords-* classes.
// This ensures the prefixed CSS rules continue to target the element from the other updaters.
const safelyRemoveClasses = (element, classes) => {
  if (!element) { return; }

  const otherClasses = [...element.classList].filter(c => !classes.includes(c));
  const hasOtherClass = otherClasses.some(c => c.startsWith("beyondwords-"));

  const classesToRemove = hasOtherClass ? classes.filter(c => c !== "bwp") : classes;
  element.classList.remove(...classesToRemove);
};

export default SegmentClickables;
export { safelyRemoveClasses };
