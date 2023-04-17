import OwnershipMediator from "./ownershipMediator";
import { dataAttribute } from "./segmentHighlights";
import { safelyRemoveClasses } from "./segmentClickables";

const containerClasses = (m, p, s) => ["beyondwords-widget", "bwp", `marker-${m}`, `position-${p}`, `for-${s}-player`];
const markerClasses = ["beyondwords-relative", "bwp"]; // Also set by SegmentClickables.

class SegmentContainers {
  static #mediator = new OwnershipMediator(this.#addContainers, this.#removeContainers);

  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.containers = [];
  }

  update(segment, sections, position, playerStyle) {
    const sticky = sections.includes("all") || sections.includes("body");

    const previous = this.previous;
    const current = segment?.marker || (sticky && previous?.marker);

    if (current) { SegmentContainers.#mediator.addInterest(current, this, this, position, playerStyle); }
    if (previous) { SegmentContainers.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  reset() {
    this.update(null, "none");
  }

  static #addContainers(marker, self, position, playerStyle) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      const container = document.createElement("div");

      element.classList.add(...markerClasses);
      container.classList.add(...containerClasses(marker, position, playerStyle));

      const insertBefore = ["11-oclock", "12-oclock", "1-oclock"].includes(position);

      if (insertBefore) {
        element.insertBefore(container, element.firstChild);
      } else {
        element.appendChild(container);
      }

      self.containers.push(container);
    }

    self.onUpdate(self.containers);
  }

  static #removeContainers(marker, self, position, playerStyle) {
    const classes = containerClasses(marker, position, playerStyle);

    for (let i = 0; i < self.containers.length; i += 1) {
      const isMatch = classes.every(c => self.containers[i].classList.contains(c));
      if (!isMatch) { continue; }

      const element = self.containers[i].parentNode;
      safelyRemoveClasses(element, markerClasses);

      self.containers[i].remove();
      self.containers.splice(i, 1);

      i -= 1;
    }

    self.onUpdate(self.containers);
  }
}

export default SegmentContainers;
