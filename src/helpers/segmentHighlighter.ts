import OwnershipMediator from "./ownershipMediator";

const attribute = "data-beyondwords-marker";
const markClasses = (m) => ["beyondwords-highlight", "bwp", `marker-${m}`];
const markerClasses = ["beyondwords-clickable", "bwp"];

class SegmentHighlighter {
  static #mediator = new OwnershipMediator(this.#highlight, this.#unhighlight);

  highlight(type, segment, highlightMode, segmentPlayback, background) {
    if (highlightMode === "auto") { highlightMode = segmentPlayback; }

    const highlight = highlightMode === "all" || highlightMode === "body" && segment?.section === "body";
    const clickable = segmentPlayback === "all" || segmentPlayback === "body" && segment?.section === "body";

    if (!highlight) { background = null; }

    const previous = this[`prev${type}`];
    const current = background || clickable ? segment?.marker : null;

    if (current) { SegmentHighlighter.#mediator.addInterest(current, this, background, clickable); }
    if (previous) { SegmentHighlighter.#mediator.removeInterest(previous, this); }

    this[`prev${type}`] = current;
  }

  static #highlight(marker, background, clickable) {
    const markerElements = document.querySelectorAll(`[${attribute}="${marker}"]`);

    for (const element of markerElements) {
      if (clickable) { element.classList.add(...markerClasses); }
      if (!background) { continue; } // Don't add marks if no background.

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

  static #unhighlight(marker, background, clickable) {
    const markerElements = document.querySelectorAll(`[${attribute}="${marker}"]`);

    for (const element of markerElements) {
      if (clickable) { element.classList.remove(...markerClasses); }
      if (!background) { continue; } // There are no marks to remove.

      const markElements = element.querySelectorAll(`mark.${markClasses(marker)}`);

      for (const mark of markElements) {
        for (const child of mark.childNodes) {
          mark.parentNode.insertBefore(child, mark);
          mark.remove();
        }
      }
    }
  }
}

export default SegmentHighlighter;
export { attribute };
