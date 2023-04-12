import OwnershipMediator from "./ownershipMediator";

const attribute = "data-beyondwords-marker";
const markClasses = (m) => ["beyondwords-highlight", "bwp", `marker-${m}`];
const markerClasses = ["beyondwords-clickable", "bwp"];

class SegmentHighlighter {
  static #mediator = new OwnershipMediator(this.#highlight, this.#unhighlight);

  highlight(type, segment, highlightMode, modeWhenAuto, background) {
    const mode = highlightMode === "auto" ? modeWhenAuto : highlightMode;
    const enabled = mode === "all" || mode === "body" && segment?.section === "body";

    const current = enabled ? segment?.marker : null;
    const previous = this[`prev${type}`];

    if (current) { SegmentHighlighter.#mediator.addInterest(current, this, background); }
    if (previous) { SegmentHighlighter.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #highlight(marker, background) {
    const markerElements = document.querySelectorAll(`[${attribute}="${marker}"]`);

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

      element.classList.add(...markerClasses);
    }
  }

  static #unhighlight(marker) {
    const markElements = document.querySelectorAll(`[${attribute}="${marker}"] mark.${markClasses(marker)}`);

    for (const element of markElements) {
      for (const child of element.childNodes) {
        element.parentNode.insertBefore(child, element);
        element.remove();
      }
    }
  }
}

export default SegmentHighlighter;
export { attribute };
