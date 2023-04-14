import OwnershipMediator from "./ownershipMediator";

const dataAttribute = "data-beyondwords-marker";
const markClasses = (m) => ["beyondwords-highlight", "bwp", `marker-${m}`];

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);

  update(type, segment, sections, background) {
    const typeSections = this.#sectionsForType(type, sections);
    const enabled = typeSections === "all" || typeSections === "body" && segment?.section === "body";

    const previous = this[`prev${type}`];
    const current = enabled ? segment?.marker : null;

    if (current) { SegmentHighlights.#mediator.addInterest(current, this, background); }
    if (previous) { SegmentHighlights.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #addHighlights(marker, background) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let node;

      while ((node = walker.nextNode())) {
        const isEmpty = /^\s*$/.test(node.nodeValue);
        if (isEmpty) { continue; }

        const isLink = node.parentNode.nodeName.toLowerCase() === "a";
        if (isLink) { node = node.parentNode; }

        const mark = document.createElement("mark");

        mark.classList.add(...markClasses(marker));
        mark.style.background = background;

        node.parentNode.insertBefore(mark, node);
        mark.appendChild(node);
      }
    }
  }

  static #removeHighlights(marker) {
    const markerElements = document.querySelectorAll(`[${dataAttribute}="${marker}"]`);

    for (const element of markerElements) {
      const markElements = element.querySelectorAll(`mark.${markClasses(marker)}`);

      for (const mark of markElements) {
        for (const child of mark.childNodes) {
          mark.parentNode.insertBefore(child, mark);
          mark.remove();
        }
      }
    }
  }

  // private

  #sectionsForType(type, sections) {
    let [currentSections, hoveredSections] = sections.split("-");

    if (type === "current") {
      return currentSections;
    } else {
      return hoveredSections || currentSections;
    }
  }
}

export default SegmentHighlights;
export { dataAttribute };
