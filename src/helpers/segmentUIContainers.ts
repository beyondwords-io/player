import OwnershipMediator from "./ownershipMediator";
import { attribute } from "./segmentHighlighter";

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

    const newElements = [...markerElements].filter(e => !self.containers.includes(e));
    if (newElements.length === 0) { return; }

    // TODO: add adjacent container?

    self.containers = self.containers.concat(newElements);
    self.onUpdate(self.containers);
  }

  static #removeContainers(marker, self) {
    const oldElements = self.containers.filter(e => marker === e.getAttribute(attribute));
    if (oldElements.length === 0) { return; }

    // TODO: add remove adjacent container?

    self.containers = self.containers.filter(e => !oldElements.includes(e));
    self.onUpdate(self.containers);
  }
}

export default SegmentUIContainers;
