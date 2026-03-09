import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";
import getWordHighlightAnimation from "./wordHighlightAnimations";

const CORNER_RADIUS = 3;
const SVG_NS = "http://www.w3.org/2000/svg";

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);
  static #elementState = new WeakMap();
  static #activeHighlights = new Map();
  static #savedWordState = new WeakMap();

  static {
    addEventListener("resize", () => SegmentHighlights.#handleResize());
  }

  constructor() {
    this.ids = new SegmentIdGenerator();
  }

  update(type, segment, sections, background, currentTime = 0, currentMarker = null) {
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    this[`prev${type}`] = current;

    if (current) {
      if (current !== previous) {
        SegmentHighlights.#mediator.addInterest(current, this, this, segment, background);
      }
      this.#updateWordHighlight(segment, currentTime, currentMarker);
    }
    if (previous && previous !== current) {
      SegmentHighlights.#mediator.removeInterest(previous, this);
    }
  }

  reset(type) {
    this.update(type, null, ["none"], null, 0, null);
  }

  #updateWordHighlight(segment, currentTime, currentMarker) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime || 0;
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000;
    const animation = getWordHighlightAnimation();

    for (const element of this.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state?.wordRect) continue;

      const highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) continue;

      const containerRect = element.getBoundingClientRect();

      if (Math.abs(containerRect.width - state.cachedWidth) > 1 || Math.abs(containerRect.height - state.cachedHeight) > 1) {
        SegmentHighlights.#rebuildOverlay(state, highlightData, containerRect);
      }

      const currentWordIndex = segment.marker === currentMarker
        ? SegmentHighlights.#findCurrentWordIndex(timeInSegmentMs, highlightData.wordRanges)
        : -1;

      if (currentWordIndex !== highlightData.currentWordIndex) {
        highlightData.currentWordIndex = currentWordIndex;

        if (currentWordIndex >= 0 && currentWordIndex < highlightData.wordRanges.length) {
          const currentWord = highlightData.wordRanges[currentWordIndex];
          const wordRects = SegmentHighlights.#getRangeRects(
            highlightData.charMap, currentWord.start_index, currentWord.end_index, containerRect
          );

          if (wordRects.length > 0) {
            const r = wordRects.length === 1 ? wordRects[0] : {
              x: Math.min(...wordRects.map(r => r.x)),
              y: Math.min(...wordRects.map(r => r.y)),
              width: Math.max(...wordRects.map(r => r.x + r.width)) - Math.min(...wordRects.map(r => r.x)),
              height: Math.max(...wordRects.map(r => r.y + r.height)) - Math.min(...wordRects.map(r => r.y)),
            };

            animation.show(state.wordRect, r);
          }
        } else {
          animation.hide(state.wordRect);
        }
      }
    }
  }

  static #buildHighlightData(element, words) {
    const charMap = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let fullText = "";

    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, offset: i });
        fullText += text[i];
      }
    }

    const trimmedText = fullText.replace(/^\s+/, "");
    const leadingWhitespace = fullText.length - trimmedText.length;
    const wordRanges = [];
    let searchPos = leadingWhitespace;

    for (const word of (words || [])) {
      const foundPos = fullText.indexOf(word.text, searchPos);
      if (foundPos !== -1) {
        wordRanges.push({
          start_index: foundPos,
          end_index: foundPos + word.text.length,
          start_time: word.startTime * 1000,
          duration: word.duration * 1000,
          text: word.text,
        });
        searchPos = foundPos + word.text.length;
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

    return Array.from(range.getClientRects()).map(rect => ({
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

    return Array.from(range.getClientRects()).map(rect => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  }

  // Darken a CSS color by a given factor (0–1, where 0.25 = 25% darker).
  // Uses a temporary DOM element to resolve any CSS color value into rgb.
  static #darken(color, amount) {
    const el = document.createElement("span");
    el.style.color = color;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    el.remove();

    const match = computed.match(/[\d.]+/g);
    if (!match) return color;

    const [r, g, b] = match.map(Number);
    const factor = 1 - amount;
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  }

  static #roundedRectPath(x, y, width, height, r) {
    return `M${x + r},${y} h${width - 2 * r} q${r},0 ${r},${r} v${height - 2 * r} q0,${r} -${r},${r} h-${width - 2 * r} q-${r},0 -${r},-${r} v-${height - 2 * r} q0,-${r} ${r},-${r} z`;
  }

  static #findCurrentWordIndex(currentTimeMs, wordRanges) {
    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      if (currentTimeMs >= word.start_time && currentTimeMs < word.start_time + word.duration) {
        return i;
      }
    }
    return -1;
  }

  static #handleResize() {
    const animation = getWordHighlightAnimation();

    for (const [element, highlightData] of SegmentHighlights.#activeHighlights) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state) continue;

      const containerRect = element.getBoundingClientRect();
      SegmentHighlights.#rebuildOverlay(state, highlightData, containerRect);

      const wordIndex = highlightData.currentWordIndex;
      if (wordIndex >= 0 && wordIndex < highlightData.wordRanges.length) {
        const word = highlightData.wordRanges[wordIndex];
        const wordRects = SegmentHighlights.#getRangeRects(
          highlightData.charMap, word.start_index, word.end_index, containerRect
        );

        if (wordRects.length > 0) {
          const r = wordRects.length === 1 ? wordRects[0] : {
            x: Math.min(...wordRects.map(r => r.x)),
            y: Math.min(...wordRects.map(r => r.y)),
            width: Math.max(...wordRects.map(r => r.x + r.width)) - Math.min(...wordRects.map(r => r.x)),
            height: Math.max(...wordRects.map(r => r.y + r.height)) - Math.min(...wordRects.map(r => r.y)),
          };

          animation.show(state.wordRect, r);
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

  static #addHighlights(uniqueId, self, segment, background) {
    const animation = getWordHighlightAnimation();

    for (const element of self.#highlightElements(segment)) {
      const hasWords = segment.words?.length > 0;

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

      const originalStyles = {
        position: element.style.position,
        isolation: element.style.isolation,
      };

      const highlightData = SegmentHighlights.#buildHighlightData(element, segment.words);
      SegmentHighlights.#activeHighlights.set(element, highlightData);

      const computed = getComputedStyle(element);
      if (computed.position === "static") {
        element.style.position = "relative";
      }
      element.style.isolation = "isolate";

      const containerRect = element.getBoundingClientRect();
      const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;

      const overlaySvg = document.createElementNS(SVG_NS, "svg");
      overlaySvg.style.position = "absolute";
      overlaySvg.style.top = `${-borderTop}px`;
      overlaySvg.style.left = `${-borderLeft}px`;
      overlaySvg.style.zIndex = "-1";
      overlaySvg.style.pointerEvents = "none";
      overlaySvg.style.overflow = "visible";
      overlaySvg.setAttribute("width", String(containerRect.width));
      overlaySvg.setAttribute("height", String(containerRect.height));

      const paragraphGroup = document.createElementNS(SVG_NS, "g");
      const wordColor = SegmentHighlights.#darken(background, 0.20);

      for (const rect of SegmentHighlights.#getTextRects(highlightData.charMap, containerRect)) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
        path.setAttribute("fill", background);
        paragraphGroup.appendChild(path);
      }
      overlaySvg.appendChild(paragraphGroup);

      const wordRect = document.createElementNS(SVG_NS, "rect");
      wordRect.setAttribute("rx", String(CORNER_RADIUS));
      wordRect.setAttribute("ry", String(CORNER_RADIUS));
      wordRect.setAttribute("fill", wordColor);
      animation.setup(wordRect);
      overlaySvg.appendChild(wordRect);

      element.prepend(overlaySvg);

      SegmentHighlights.#elementState.set(element, {
        uniqueId,
        originalStyles,
        segment,
        background,
        overlaySvg,
        paragraphGroup,
        wordRect,
        cachedWidth: containerRect.width,
        cachedHeight: containerRect.height,
      });

      // Restore word highlight position saved before the overlay was destroyed
      // (e.g. hover/unhover cycle).
      const savedWord = SegmentHighlights.#savedWordState.get(element);
      if (savedWord && savedWord.marker === segment.marker) {
        animation.restore(wordRect, savedWord.styles);
        highlightData.currentWordIndex = savedWord.currentWordIndex;
      }
      SegmentHighlights.#savedWordState.delete(element);
    }
  }

  static #removeHighlights(uniqueId, self, segment) {
    const animation = getWordHighlightAnimation();

    for (const element of self.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (state && state.uniqueId === uniqueId) {
        const highlightData = SegmentHighlights.#activeHighlights.get(element);
        if (highlightData && highlightData.currentWordIndex >= 0) {
          SegmentHighlights.#savedWordState.set(element, {
            marker: segment.marker,
            currentWordIndex: highlightData.currentWordIndex,
            styles: animation.save(state.wordRect),
          });
        } else {
          SegmentHighlights.#savedWordState.delete(element);
        }

        state.overlaySvg?.remove();
        element.style.position = state.originalStyles.position;
        element.style.isolation = state.originalStyles.isolation;
        SegmentHighlights.#elementState.delete(element);
        SegmentHighlights.#activeHighlights.delete(element);
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
