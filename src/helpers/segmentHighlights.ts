import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";
import getWordHighlightAnimation from "./wordHighlightAnimations";

const CORNER_RADIUS = 3;
const SVG_NS = "http://www.w3.org/2000/svg";

// Normalize unicode whitespace variants to regular spaces for text matching.
// Covers non-breaking space, en/em/thin/hair spaces, narrow no-break space, etc.
const WHITESPACE_RE = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
const normalizeWhitespace = (text) => text.replace(WHITESPACE_RE, " ");

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);
  static #elementState = new WeakMap();
  static #activeHighlights = new WeakMap();
  static #activeElements = new Set();
  static #resizeRafId = 0;

  static {
    addEventListener("resize", () => {
      cancelAnimationFrame(SegmentHighlights.#resizeRafId);
      SegmentHighlights.#resizeRafId = requestAnimationFrame(() => SegmentHighlights.#handleResize());
    });
  }

  #ids;
  #segments = {};

  constructor() {
    this.#ids = new SegmentIdGenerator();
  }

  update(type, segment, sections, background, wordHighlightColor, currentTime = 0, activeMarker = null, wordHighlightsEnabled = false) {
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.#ids.fetchOrAdd(segment) : null;

    const prevBg = this[`prevBg${type}`];
    const prevWc = this[`prevWc${type}`];
    const argsChanged = background !== prevBg || wordHighlightColor !== prevWc;

    this[`prev${type}`] = current;
    this[`prevBg${type}`] = background;
    this[`prevWc${type}`] = wordHighlightColor;

    // Store segment for callback access. The segment object reference may
    // differ between "current" and "hovered" even for the same logical
    // segment. Storing it here and passing only primitives to the mediator
    // ensures #arraysEqual sees equal args, preventing spurious
    // destroy/recreate cycles on hover/unhover.
    if (current && segment) {
      this.#segments[current] = segment;
    }

    // Interact with mediator when segment identity or visual args change.
    if (current !== previous || (current && argsChanged)) {
      if (current) {
        SegmentHighlights.#mediator.addInterest(current, this, this, background, wordHighlightColor, wordHighlightsEnabled);
      }
      if (previous) {
        SegmentHighlights.#mediator.removeInterest(previous, this);
      }
    }

    // Clean up stored segment when no type references the resource.
    if (previous && previous !== current) {
      const otherType = type === "current" ? "hovered" : "current";
      if (this[`prev${otherType}`] !== previous) {
        delete this.#segments[previous];
      }
    }

    // Hot path: update word position without touching the mediator or DOM structure.
    if (current && wordHighlightsEnabled) {
      this.#updateWordHighlight(segment, currentTime, activeMarker);
    }
  }

  reset(type) {
    this.update(type, null, ["none"], null, null, 0, null, false);
  }

  #updateWordHighlight(segment, currentTime, activeMarker) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime ?? 0;
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000;
    const animation = getWordHighlightAnimation();

    for (const element of this.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state?.wordGroup) continue;

      const highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) continue;

      const currentWordIndex = segment.marker === activeMarker
        ? SegmentHighlights.#findCurrentWordIndex(timeInSegmentMs, highlightData.wordRanges)
        : -1;

      if (currentWordIndex === highlightData.currentWordIndex) continue;
      highlightData.currentWordIndex = currentWordIndex;

      if (currentWordIndex >= 0 && currentWordIndex < highlightData.wordRanges.length) {
        // Only force layout when word actually changes — this is the expensive part.
        const containerRect = element.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) continue;

        const currentWord = highlightData.wordRanges[currentWordIndex];
        const wordRects = SegmentHighlights.#getRangeRects(
          highlightData.charMap, currentWord.startIndex, currentWord.endIndex, containerRect
        );

        if (wordRects.length > 0) {
          animation.show(state.wordGroup, wordRects);
        }
      } else {
        animation.hide(state.wordGroup);
      }
    }
  }

  static #buildHighlightData(element, words) {
    const charMap = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let normalizedText = "";

    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, offset: i });
        normalizedText += WHITESPACE_RE.test(text[i]) ? " " : text[i];
      }
    }

    const trimmed = normalizedText.replace(/^\s+/, "");
    const leadingWs = normalizedText.length - trimmed.length;
    const wordRanges = [];
    let searchPos = leadingWs;

    for (const word of (words || [])) {
      const normalizedWord = normalizeWhitespace(word.text);
      const foundPos = normalizedText.indexOf(normalizedWord, searchPos);
      if (foundPos !== -1) {
        wordRanges.push({
          startIndex: foundPos,
          endIndex: foundPos + normalizedWord.length,
          startTime: word.startTime * 1000,
          duration: word.duration * 1000,
        });
        searchPos = foundPos + normalizedWord.length;
      }
    }

    return { charMap, wordRanges, currentWordIndex: -1 };
  }

  static #getRangeRects(charMap, startIndex, endIndex, containerRect) {
    if (startIndex >= charMap.length || endIndex > charMap.length) return [];

    const startPoint = charMap[startIndex];
    const endPoint = charMap[Math.min(endIndex - 1, charMap.length - 1)];
    if (!startPoint || !endPoint) return [];

    const range = document.createRange();
    try {
      range.setStart(startPoint.node, startPoint.offset);
      range.setEnd(endPoint.node, endPoint.offset + 1);
    } catch (e) {
      return [];
    }

    return Array.from(range.getClientRects())
      .filter(rect => rect.width > 0 && rect.height > 0)
      .map(rect => ({
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      }));
  }

  static #getTextRects(charMap, containerRect) {
    if (charMap.length === 0) return [];

    const range = document.createRange();
    try {
      range.setStart(charMap[0].node, charMap[0].offset);
      range.setEnd(charMap[charMap.length - 1].node, charMap[charMap.length - 1].offset + 1);
    } catch (e) {
      return [];
    }

    return SegmentHighlights.#mergeLineRects(range.getClientRects(), containerRect);
  }

  // getClientRects returns a separate rect for each inline element
  // (e.g. <strong>, <a>) which overlap on the same line. Merge them
  // into one rect per visual line to avoid double-opacity artifacts.
  static #mergeLineRects(clientRects, containerRect) {
    const rects = Array.from(clientRects).filter(r => r.width > 0 && r.height > 0);
    if (rects.length === 0) return [];

    const lines = [{ left: rects[0].left, top: rects[0].top, right: rects[0].right, bottom: rects[0].bottom }];

    for (let i = 1; i < rects.length; i++) {
      const r = rects[i];
      const line = lines[lines.length - 1];
      const sameLine = Math.abs(r.top - line.top) < line.bottom - line.top;

      if (sameLine) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else {
        lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }

    return lines.map(l => ({
      x: l.left - containerRect.left,
      y: l.top - containerRect.top,
      width: l.right - l.left,
      height: l.bottom - l.top,
    }));
  }

  static #roundedRectPath(x, y, width, height, r) {
    return `M${x + r},${y} h${width - 2 * r} q${r},0 ${r},${r} v${height - 2 * r} q0,${r} -${r},${r} h-${width - 2 * r} q-${r},0 -${r},-${r} v-${height - 2 * r} q0,-${r} ${r},-${r} z`;
  }

  static #findCurrentWordIndex(currentTimeMs, wordRanges) {
    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      if (currentTimeMs >= word.startTime && currentTimeMs < word.startTime + word.duration) {
        return i;
      }
    }
    return -1;
  }

  static #handleResize() {
    const animation = getWordHighlightAnimation();

    for (const element of SegmentHighlights.#activeElements) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state) continue;

      const highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) continue;

      const containerRect = element.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) continue;

      SegmentHighlights.#rebuildOverlay(state, highlightData, containerRect);

      const wordIndex = highlightData.currentWordIndex;
      if (wordIndex >= 0 && wordIndex < highlightData.wordRanges.length) {
        const word = highlightData.wordRanges[wordIndex];
        const wordRects = SegmentHighlights.#getRangeRects(
          highlightData.charMap, word.startIndex, word.endIndex, containerRect
        );

        if (wordRects.length > 0) {
          animation.show(state.wordGroup, wordRects);
        }
      }
    }
  }

  static #rebuildOverlay(state, highlightData, containerRect) {
    state.cachedWidth = containerRect.width;
    state.cachedHeight = containerRect.height;

    state.overlaySvg.setAttribute("width", String(containerRect.width));
    state.overlaySvg.setAttribute("height", String(containerRect.height));

    const pg = state.paragraphGroup;
    while (pg.firstChild) pg.removeChild(pg.firstChild);

    for (const rect of SegmentHighlights.#getTextRects(highlightData.charMap, containerRect)) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
      path.setAttribute("fill", state.background);
      pg.appendChild(path);
    }
  }

  static #addHighlights(uniqueId, self, background, wordHighlightColor, wordHighlightsEnabled) {
    const segment = self.#segments[uniqueId];
    if (!segment) return;

    for (const element of self.#highlightElements(segment)) {
      const hasWords = wordHighlightsEnabled && segment.words?.length > 0;

      if (!hasWords) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          if (/^\s*$/.test(node.nodeValue)) continue;
          const isLink = node.parentNode.nodeName.toLowerCase() === "a";
          if (isLink) { node = node.parentNode; }
          const mark = document.createElement("mark");
          mark.classList.add("beyondwords-highlight", "bwp", `id-${uniqueId}`);
          mark.style.background = background;
          node.parentNode.insertBefore(mark, node);
          mark.appendChild(node);
        }
        continue;
      }

      const containerRect = element.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) continue;

      const originalStyles = {
        position: element.style.position,
        isolation: element.style.isolation,
      };

      try {
        const highlightData = SegmentHighlights.#buildHighlightData(element, segment.words);
        SegmentHighlights.#activeHighlights.set(element, highlightData);
        SegmentHighlights.#activeElements.add(element);

        const computed = getComputedStyle(element);
        if (computed.position === "static") {
          element.style.position = "relative";
        }
        element.style.isolation = "isolate";

        const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
        const borderTop = parseFloat(computed.borderTopWidth) || 0;
        const direction = computed.direction;

        const overlaySvg = document.createElementNS(SVG_NS, "svg");
        overlaySvg.style.position = "absolute";
        overlaySvg.style.top = `${-borderTop}px`;
        overlaySvg.style.left = `${-borderLeft}px`;
        overlaySvg.style.zIndex = "-1";
        overlaySvg.style.pointerEvents = "none";
        overlaySvg.style.overflow = "visible";
        overlaySvg.setAttribute("width", String(containerRect.width));
        overlaySvg.setAttribute("height", String(containerRect.height));
        if (direction === "rtl") {
          overlaySvg.setAttribute("direction", "rtl");
        }

        const paragraphGroup = document.createElementNS(SVG_NS, "g");

        for (const rect of SegmentHighlights.#getTextRects(highlightData.charMap, containerRect)) {
          const path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
          path.setAttribute("fill", background);
          paragraphGroup.appendChild(path);
        }
        overlaySvg.appendChild(paragraphGroup);

        const wordGroup = document.createElementNS(SVG_NS, "g");
        wordGroup.style.opacity = "0";
        wordGroup.style.transition = "opacity 120ms ease-out";
        wordGroup.setAttribute("data-rx", String(CORNER_RADIUS));
        wordGroup.setAttribute("data-ry", String(CORNER_RADIUS));
        wordGroup.setAttribute("data-fill", wordHighlightColor);
        overlaySvg.appendChild(wordGroup);

        element.prepend(overlaySvg);

        SegmentHighlights.#elementState.set(element, {
          uniqueId,
          originalStyles,
          segment,
          background,
          overlaySvg,
          paragraphGroup,
          wordGroup,
          cachedWidth: containerRect.width,
          cachedHeight: containerRect.height,
        });
      } catch (e) {
        // Restore styles if overlay creation fails partway through.
        element.style.position = originalStyles.position;
        element.style.isolation = originalStyles.isolation;
        SegmentHighlights.#activeHighlights.delete(element);
        SegmentHighlights.#activeElements.delete(element);
      }
    }
  }

  static #removeHighlights(uniqueId, self, background, wordHighlightColor, wordHighlightsEnabled) {
    const segment = self.#segments[uniqueId];
    if (!segment) return;

    for (const element of self.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (state && state.uniqueId === uniqueId) {
        state.overlaySvg?.remove();
        element.style.position = state.originalStyles.position;
        element.style.isolation = state.originalStyles.isolation;
        SegmentHighlights.#elementState.delete(element);
        SegmentHighlights.#activeHighlights.delete(element);
        SegmentHighlights.#activeElements.delete(element);
      } else {
        const markElements = element.querySelectorAll(`mark.beyondwords-highlight.bwp.id-${uniqueId}`);
        for (const mark of markElements) {
          for (const child of mark.childNodes) {
            mark.parentNode.insertBefore(child, mark);
            mark.remove();
          }
        }
      }
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
