import OwnershipMediator from "./ownershipMediator";
import { dataAttribute } from "./segmentHighlights";

const markerClasses = ["beyondwords-clickable", "bwp"]; // Also set by SegmentContainers.

class SegmentClickables {
  static #mediator = new OwnershipMediator(this.#addClasses, this.#removeClasses);

  update(segment, clickableMode, modeWhenAuto) {
    const mode = clickableMode === "auto" ? modeWhenAuto : clickableMode;
    const enabled = mode === "all" || mode === "body" && segment?.section === "body";

    const previous = this.previous;
    const current = enabled ? segment?.marker : null;

    if (current) { SegmentClickables.#mediator.addInterest(current, this); }
    if (previous) { SegmentClickables.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  static #addClasses(marker) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      element.classList.add(...markerClasses);
    }
  }

  static #removeClasses(marker) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      safelyRemoveClasses(element, markerClasses);
    }
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
