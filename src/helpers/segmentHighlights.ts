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
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

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

  // Highlight the segmentElement and all DOM nodes with the same marker. There
  // might be an edge case where the segment was matched using (xpath, md5) and
  // the marker set on the DOM node does not match the one from the API. In this
  // case, pool all elements together anyway and highlight all of them.
  #highlightElements(segment) {
    const set = new Set([segment.segmentElement]);

    const marker1 = segment.marker;
    const marker2 = segment.segmentElement?.getAttribute("data-beyondwords-marker");

    for (const marker of [marker1, marker2].filter(m => m)) {
      const elements = document.querySelectorAll(`[data-beyondwords-marker="${marker}"]`);
      for (const element of elements) { set.add(element); }
    }

    return set;
  }
}

export default SegmentHighlights;
