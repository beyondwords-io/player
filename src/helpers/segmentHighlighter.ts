import ReferenceCount from "./referenceCount";

const attribute = "data-beyondwords-marker";
const markClasses = (m) => ["beyondwords-highlight", "bwp", `marker-${m}`];
const markerClasses = ["beyondwords-clickable", "bwp"];

class SegmentHighlighter {
  // Use a reference counting pattern to avoid unnecessary updates to the DOM.
  // This is static in case multiple players want to highlight the same segment.
  static #markers = new ReferenceCount();

  highlight(type, segment, highlightMode, playbackMode, background) {
    const mode = highlightMode === "auto" ? playbackMode : highlightMode;
    const enabled = mode === "all" || mode === "body" && segment?.section === "body";

    const current = enabled ? segment?.marker : null;
    const previous = this[`prev${type}`];

    if (current === previous) { return; }

    SegmentHighlighter.#markers.reference(current, () => this.#highlight(type, current, background));
    SegmentHighlighter.#markers.unreference(previous, () => this.#unhighlight(previous));

    this[`prev${type}`] = segment?.marker;
  }

  #highlight(type, marker, background) {
    const markerElements = document.querySelectorAll(`[${attribute}="${marker}"]`);

    for (const element of markerElements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let node;

      while ((node = walker.nextNode())) {
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

  #unhighlight(marker) {
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
