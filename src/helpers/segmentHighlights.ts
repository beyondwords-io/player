import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";

const markClasses = (id) => ["beyondwords-highlight", "bwp", `id-${id}`];

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);

  constructor() {
    this.ids = new SegmentIdGenerator();
  }

  update(type, segment, sections, background) {
    const enabled = sectionEnabled(type, segment, sections);

    const previous = this[`prev${type}`];
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    if (current) { SegmentHighlights.#mediator.addInterest(current, this, this, segment, background); }
    if (previous) { SegmentHighlights.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #addHighlights(uniqueId, self, segment, background) {
    for (const element of self.#highlightElements(segment)) {
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

  static #removeHighlights(uniqueId, self, segment) {
    for (const element of self.#highlightElements(segment)) {
      const markElements = element.querySelectorAll(`mark.${markClasses(uniqueId)}`);

      for (const mark of markElements) {
        for (const child of mark.childNodes) {
          mark.parentNode.insertBefore(child, mark);
          mark.remove();
        }
      }
    }
  }

  #highlightElements(segment) {
    const set = new Set([segment.segmentElement]);

    if (segment.marker) {
      const elements = document.querySelectorAll(`[data-beyondwords-marker="${segment.marker}"]`);
      for (const element of elements) { set.add(element); }
    }

    return set;
  }
}

export default SegmentHighlights;
