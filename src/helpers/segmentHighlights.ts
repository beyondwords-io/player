import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";
import * as svgOverlay from "./svgHighlightOverlay";
import { getRangeRects, findCurrentWordIndex } from "./highlightTextMap";
import getWordHighlightAnimation from "./wordHighlightAnimations";

const markClasses = (id) => ["beyondwords-highlight", "bwp", `id-${id}`];

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);

  #ids;
  #segments = {};

  constructor() {
    this.#ids = new SegmentIdGenerator();
  }

  update(type, segment, options) {
    const { sections, background, wordHighlightColor, currentTime = 0, activeMarker = null, wordHighlightsEnabled = false } = options;

    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.#ids.fetchOrAdd(segment) : null;

    this[`prev${type}`] = current;

    if (current && segment) { this.#segments[current] = segment; }

    if (current !== previous) {
      if (current) {
        SegmentHighlights.#mediator.addInterest(current, this, this, background, wordHighlightColor, wordHighlightsEnabled);
      }
      if (previous) {
        SegmentHighlights.#mediator.removeInterest(previous, this);
      }
    }

    if (current && wordHighlightsEnabled && type === "current") {
      this.#updateWordHighlight(segment, currentTime, activeMarker);
    }
  }

  reset(type) {
    this.update(type, null, { sections: ["none"], background: null, wordHighlightColor: null });
  }

  #updateWordHighlight(segment, currentTime, activeMarker) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime ?? 0;
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000;
    const segmentDurationMs = (segment.duration ?? Infinity) * 1000;
    const animation = getWordHighlightAnimation();

    for (const element of this.#highlightElements(segment)) {
      const state = svgOverlay.getState(element);
      if (!state?.wordGroup) continue;

      const currentWordIndex = segment.marker === activeMarker
        ? findCurrentWordIndex(timeInSegmentMs, state.wordRanges, segmentDurationMs)
        : -1;

      if (currentWordIndex === state.currentWordIndex) continue;
      state.currentWordIndex = currentWordIndex;

      if (currentWordIndex >= 0 && currentWordIndex < state.wordRanges.length) {
        const containerRect = element.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) continue;

        const currentWord = state.wordRanges[currentWordIndex];
        const wordRects = getRangeRects(
          state.charMap, currentWord.startIndex, currentWord.endIndex, containerRect
        );

        if (wordRects.length > 0) {
          animation.show(state.wordGroup, wordRects);
        }
      } else {
        animation.hide(state.wordGroup);
      }
    }
  }

  static #addHighlights(uniqueId, self, background, wordHighlightColor, wordHighlightsEnabled) {
    const segment = self.#segments[uniqueId];
    if (!segment) return;

    for (const element of self.#highlightElements(segment)) {
      const hasWords = wordHighlightsEnabled && segment.words?.length > 0;

      if (hasWords) {
        svgOverlay.create(element, uniqueId, background, wordHighlightColor, segment.words);
      } else {
        SegmentHighlights.#addMarkHighlights(element, uniqueId, background);
      }
    }
  }

  static #addMarkHighlights(element, uniqueId, background) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (/^\s*$/.test(node.nodeValue)) continue;
      const isLink = node.parentNode.nodeName.toLowerCase() === "a";
      if (isLink) { node = node.parentNode; }
      const mark = document.createElement("mark");
      mark.classList.add(...markClasses(uniqueId));
      mark.style.background = background;
      node.parentNode.insertBefore(mark, node);
      mark.appendChild(node);
    }
  }

  static #removeHighlights(uniqueId, self) {
    const segment = self.#segments[uniqueId];
    if (!segment) return;

    for (const element of self.#highlightElements(segment)) {
      if (!svgOverlay.remove(element, uniqueId)) {
        SegmentHighlights.#removeMarkHighlights(element, uniqueId);
      }
    }

    delete self.#segments[uniqueId];
  }

  static #removeMarkHighlights(element, uniqueId) {
    const markElements = element.querySelectorAll(`mark.beyondwords-highlight.bwp.id-${uniqueId}`);
    for (const mark of markElements) {
      while (mark.firstChild) {
        mark.parentNode.insertBefore(mark.firstChild, mark);
      }
      mark.remove();
    }
  }

  #highlightElements(segment) {
    const set = new Set();

    if (segment.segmentElement) { set.add(segment.segmentElement); }

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
