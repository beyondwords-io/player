import OwnershipMediator from "./ownershipMediator";
import { attribute } from "./segmentHighlighter";

const containerClasses = (m) => ["beyondwords-segment-ui", "bwp", `marker-${m}`];

class SegmentUIContainers {
  static #mediator = new OwnershipMediator(this.#addContainers, this.#removeContainers);

  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.containers = [];
  }

  addOrRemove(type, segment, playbackMode, modeWhenAuto) {
    const mode = playbackMode === "auto" ? modeWhenAuto : playbackMode;
    const enabled = mode === "all" || mode === "body" && segment?.section === "body";

    const current = enabled ? segment?.marker : null;
    const previous = this[`prev${type}`];

    if (current) { SegmentUIContainers.#mediator.addInterest(current, this, this); }
    if (previous) { SegmentUIContainers.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #addContainers(marker, self) {
    const markerElements = document.querySelectorAll(`[${attribute}="${marker}"]`);

    for (const element of markerElements) {
      const container = document.createElement("div");

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

      self.containers[i].remove();
      self.containers.splice(i, 1);

      i -= 1;
    }

    self.onUpdate(self.containers);
  }
}

export default SegmentUIContainers;
