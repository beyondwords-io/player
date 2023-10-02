import OwnershipMediator from "./ownershipMediator";
import { safelyRemoveClasses } from "./segmentClickables";

const containerClasses = (id, p, s) => ["beyondwords-widget", "bwp", `id-${id}`, `position-${p}`, `for-${s}-player`];
const relativeClasses = ["beyondwords-relative", "bwp"]; // Also set by SegmentClickables.

class SegmentContainers {
  static #mediator = new OwnershipMediator(this.#addContainers, this.#removeContainers);

  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.containers = [];
    this.uniqueIds = new WeakMap();
  }

  update(segment, sections, position, playerStyle) {
    const sticky = sections.includes("all") || sections.includes("body");

    const previous = this.previous;
    const current = segment?.segmentElement || (sticky && previous?.segmentElement);

    if (current) { SegmentContainers.#mediator.addInterest(current, this, this, position, playerStyle); }
    if (previous) { SegmentContainers.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  reset() {
    this.update(null, "none");
  }

  static #addContainers(segmentElement, self, position, playerStyle) {
    const uniqueId = self.#uniqueId(segmentElement);
    const element = segmentElement; // TODO: first that matches marker?

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

  static #removeContainers(segmentElement, self, position, playerStyle) {
    const uniqueId = self.#uniqueId(segmentElement);
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

  // Give each segmentElement a uniqueId per player so that we don't remove the
  // widget for a segmentElement when other players might still want to show it.
  #uniqueId(segmentElement) {
    const exists = this.uniqueIds.has(segmentElement);
    if (!exists) { this.uniqueIds.set(segmentElement, this.#randomString()); }

    return this.uniqueIds.get(segmentElement);
  }

  #randomString() {
    return Math.random().toString(36).substring(2);
  }
}

export default SegmentContainers;
