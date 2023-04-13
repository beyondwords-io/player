import OwnershipMediator from "./ownershipMediator";
import { dataAttribute } from "./segmentHighlights";
import { safelyRemoveClasses } from "./segmentClickables";

const containerClasses = (m) => ["beyondwords-segment-widget", "bwp", `marker-${m}`];
const markerClasses = ["beyondwords-relative", "bwp"]; // Also set by SegmentClickables.

class SegmentContainers {
  static #mediator = new OwnershipMediator(this.#addContainers, this.#removeContainers);

  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.containers = [];
  }

  update(segment, playbackMode, modeWhenAuto) {
    const mode = playbackMode === "auto" ? modeWhenAuto : playbackMode;
    const enabled = mode === "all" || mode === "body" && segment?.section === "body";

    const sticky = ["all", "body"].includes(mode);

    const previous = this.previous;
    const current = (enabled && segment?.marker) || (sticky && previous);

    if (current) { SegmentContainers.#mediator.addInterest(current, this, this); }
    if (previous) { SegmentContainers.#mediator.removeInterest(previous, this); }

    this.previous = current;
  }

  reset() {
    this.update(null, "none", "none");
  }

  static #addContainers(marker, self) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      const container = document.createElement("div");

      element.classList.add(...markerClasses);
      container.classList.add(...containerClasses(marker));

      element.appendChild(container);
      self.containers.push(container);
    }

    self.onUpdate(self.containers);
  }

  static #removeContainers(marker, self) {
    const classes = containerClasses(marker);

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
