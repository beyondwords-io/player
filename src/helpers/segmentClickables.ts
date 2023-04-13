import OwnershipMediator from "./ownershipMediator";
import { dataAttribute } from "./segmentHighlights";

const markerClasses = ["beyondwords-clickable", "bwp"];

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
      element.classList.remove(...markerClasses);
    }
  }
}

export default SegmentClickables;
