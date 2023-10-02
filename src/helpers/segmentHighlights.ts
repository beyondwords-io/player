import OwnershipMediator from "./ownershipMediator";
import sectionEnabled from "./sectionEnabled";

const markClasses = (id) => ["beyondwords-highlight", "bwp", `id-${id}`];

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);

  constructor() {
    this.uniqueIds = new WeakMap();
  }

  update(type, segment, sections, background) {
    const enabled = sectionEnabled(type, segment, sections);

    const previous = this[`prev${type}`];
    const current = enabled ? segment?.segmentElement : null;

    if (current) { SegmentHighlights.#mediator.addInterest(current, this, this, segment.marker, background); }
    if (previous) { SegmentHighlights.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #addHighlights(segmentElement, self, marker, background) {
    const uniqueId = self.#uniqueId(segmentElement);
    const highlightElements = self.#elementsMatchingMarker(marker).add(segmentElement);

    for (const element of highlightElements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let node;

      while ((node = walker.nextNode())) {
        const isEmpty = /^\s*$/.test(node.nodeValue);
        if (isEmpty) { continue; }

        const isLink = node.parentNode.nodeName.toLowerCase() === "a";
        if (isLink) { node = node.parentNode; }

        const mark = document.createElement("mark");

        mark.classList.add(...markClasses(uniqueId));
        mark.style.background = background;

        node.parentNode.insertBefore(mark, node);
        mark.appendChild(node);
      }
    }
  }

  static #removeHighlights(segmentElement, self, marker) {
    const uniqueId = self.#uniqueId(segmentElement);
    const highlightElements = self.#elementsMatchingMarker(marker).add(segmentElement);

    for (const element of highlightElements) {
      const markElements = element.querySelectorAll(`mark.${markClasses(uniqueId)}`);

      for (const mark of markElements) {
        for (const child of mark.childNodes) {
          mark.parentNode.insertBefore(child, mark);
          mark.remove();
        }
      }
    }
  }

  #elementsMatchingMarker(marker) {
    const set = new Set();
    if (!marker) { return set; }

    const elements = document.querySelectorAll(`[data-beyondwords-marker="${marker}"]`);
    for (const element of elements) { set.add(element); }

    return set;
  }

  // Give each segmentElement a uniqueId per player so that we don't remove the
  // highlight for a segmentElement when other players might still want to show it.
  #uniqueId(segmentElement) {
    const exists = this.uniqueIds.has(segmentElement);
    if (!exists) { this.uniqueIds.set(segmentElement, this.#randomString()); }

    return this.uniqueIds.get(segmentElement);
  }

  #randomString() {
    return Math.random().toString(36).substring(2);
  }
}

export default SegmentHighlights;
