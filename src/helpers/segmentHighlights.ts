import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";

// SVG highlight colors
const PARAGRAPH_HIGHLIGHT_COLOR = "#D2E3FC";
const WORD_HIGHLIGHT_COLOR = "#8AB4F8";
const CORNER_RADIUS = 3;
const WORD_TRANSITION_MS = 120;
const SVG_NS = "http://www.w3.org/2000/svg";

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);
  static #elementState = new WeakMap();
  static #activeHighlights = new Map(); // Track active highlights for word updates
  static #clickHandlers = new WeakMap(); // Track click handlers for cleanup
  static #savedWordState = new WeakMap(); // Persists word rect state across overlay destroy/recreate cycles

  constructor() {
    this.ids = new SegmentIdGenerator();
    this.onEvent = null; // Will be set to emit events for seeking
  }

  update(type, segment, sections, background, currentTime = 0, isPlaying = false, isAdvert = false, currentMarker = null) {
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    if (current) {
      // Only update mediator ownership when segment changes (not on every currentTime tick)
      // to avoid stacking consumer entries that prevent proper cleanup on segment change
      if (current !== previous) {
        SegmentHighlights.#mediator.addInterest(current, this, this, segment, background);
      }
      // Update word highlighting based on current time
      this.#updateWordHighlight(segment, currentTime, isPlaying, isAdvert, currentMarker);
    }
    if (previous && previous !== current) {
      SegmentHighlights.#mediator.removeInterest(previous, this);
    }

    this[`prev${type}`] = current;
  }

  reset(type) {
    this.update(type, null, ["none"], null, 0, false, false, null);
  }

  // Update word highlighting for active segment based on current playback time
  #updateWordHighlight(segment, currentTime, isPlaying, isAdvert: boolean, currentMarker: string | null) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime || 0; // in seconds
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000; // convert to ms relative to segment start

    // Suppress word highlights if an advert is playing or this segment isn't the currently playing one
    const suppressWords = isAdvert || (segment.marker !== currentMarker);

    for (const element of this.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state?.wordRect) continue;

      const highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) continue;

      const containerRect = element.getBoundingClientRect();

      // Rebuild overlay if container resized
      if (Math.abs(containerRect.width - state.cachedWidth) > 1 || Math.abs(containerRect.height - state.cachedHeight) > 1) {
        SegmentHighlights.#rebuildOverlay(state, highlightData, containerRect);
      }

      const currentWordIndex = suppressWords ? -1 : SegmentHighlights.#findCurrentWordIndex(timeInSegmentMs, highlightData.wordRanges);

      // Store playing state for click handler
      highlightData.isPlaying = isPlaying;

      // Only update word rect DOM when word index changes (CSS transition handles animation)
      if (currentWordIndex !== highlightData.currentWordIndex) {
        highlightData.currentWordIndex = currentWordIndex;

        if (currentWordIndex >= 0 && currentWordIndex < highlightData.wordRanges.length) {
          const currentWord = highlightData.wordRanges[currentWordIndex];
          const wordRects = SegmentHighlights.#getRangeRects(
            highlightData.charMap, currentWord.start_index, currentWord.end_index, containerRect
          );

          if (wordRects.length > 0) {
            // Use bounding box of all rects (handles rare multi-line word wrapping)
            const r = wordRects.length === 1 ? wordRects[0] : {
              x: Math.min(...wordRects.map(r => r.x)),
              y: Math.min(...wordRects.map(r => r.y)),
              width: Math.max(...wordRects.map(r => r.x + r.width)) - Math.min(...wordRects.map(r => r.x)),
              height: Math.max(...wordRects.map(r => r.y + r.height)) - Math.min(...wordRects.map(r => r.y)),
            };

            state.wordRect.style.x = `${r.x}px`;
            state.wordRect.style.y = `${r.y}px`;
            state.wordRect.style.width = `${r.width}px`;
            state.wordRect.style.height = `${r.height}px`;
            state.wordRect.style.opacity = "1";
          }
        } else {
          // No active word — fade out in place
          state.wordRect.style.opacity = "0";
        }
      }
    }
  }

  // Build highlight data: character map and word ranges by finding words in DOM text
  static #buildHighlightData(element, words) {
    const charMap = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let fullText = "";

    // Build character map and full text from DOM text nodes
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, offset: i });
        fullText += text[i];
      }
    }

    // Find each word sequentially in the clean DOM text to get correct charMap indices
    const trimmedText = fullText.replace(/^\s+/, "");
    const leadingWhitespace = fullText.length - trimmedText.length;
    const wordRanges = [];
    let searchPos = leadingWhitespace;

    for (const word of (words || [])) {
      const wordText = word.text;
      const foundPos = fullText.indexOf(wordText, searchPos);

      if (foundPos !== -1) {
        wordRanges.push({
          start_index: foundPos,
          end_index: foundPos + wordText.length,
          start_time: word.startTime * 1000,  // seconds → ms
          duration: word.duration * 1000,      // seconds → ms
          text: wordText,
        });
        searchPos = foundPos + wordText.length;
      }
    }

    return { charMap, wordRanges, currentWordIndex: -1 };
  }

  // Get bounding rects for a character range using document.createRange
  static #getRangeRects(charMap, startIndex, endIndex, containerRect) {
    if (startIndex >= charMap.length || endIndex > charMap.length) {
      return [];
    }

    const startPoint = charMap[startIndex];
    const endPoint = charMap[Math.min(endIndex - 1, charMap.length - 1)];

    if (!startPoint || !endPoint) {
      return [];
    }

    const range = document.createRange();
    try {
      range.setStart(startPoint.node, startPoint.offset);
      range.setEnd(endPoint.node, endPoint.offset + 1);
    } catch (e) {
      return [];
    }

    const rects = Array.from(range.getClientRects());

    // Convert to relative coordinates
    return rects.map(rect => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  }

  // Get text line rects from character map (avoids contamination from overlay SVG elements)
  static #getTextRects(charMap: {node: Node, offset: number}[], containerRect: DOMRect) {
    if (charMap.length === 0) return [];

    const first = charMap[0];
    const last = charMap[charMap.length - 1];

    const range = document.createRange();
    try {
      range.setStart(first.node, first.offset);
      range.setEnd(last.node, last.offset + 1);
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

  // Generate SVG path for a rounded rectangle
  static #roundedRectPath(x, y, width, height, r) {
    return `
      M${x + r},${y}
      h${width - 2 * r}
      q${r},0 ${r},${r}
      v${height - 2 * r}
      q0,${r} -${r},${r}
      h-${width - 2 * r}
      q-${r},0 -${r},-${r}
      v-${height - 2 * r}
      q0,-${r} ${r},-${r}
      z`;
  }

  // Find current word index based on playback time (milliseconds from segment start)
  static #findCurrentWordIndex(currentTimeMs, wordRanges) {
    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      const wordEnd = word.start_time + word.duration;
      if (currentTimeMs >= word.start_time && currentTimeMs < wordEnd) {
        return i;
      }
    }
    return -1;
  }

  // Find which word was clicked based on click coordinates
  static #findWordAtPoint(x, y, highlightData, element) {
    const { charMap, wordRanges } = highlightData;

    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      const startPoint = charMap[word.start_index];
      const endPoint = charMap[Math.min(word.end_index - 1, charMap.length - 1)];

      if (!startPoint || !endPoint) continue;

      const range = document.createRange();
      try {
        range.setStart(startPoint.node, startPoint.offset);
        range.setEnd(endPoint.node, endPoint.offset + 1);
      } catch (e) {
        continue;
      }

      const rects = range.getClientRects();
      for (const rect of rects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return i;
        }
      }
    }
    return -1;
  }

  // Rebuild overlay SVG when the container resizes
  static #rebuildOverlay(
    state: { cachedWidth: number; cachedHeight: number; overlaySvg: SVGSVGElement; paragraphGroup: SVGGElement },
    highlightData: { charMap: {node: Node; offset: number}[] },
    containerRect: DOMRect,
  ) {
    state.cachedWidth = containerRect.width;
    state.cachedHeight = containerRect.height;

    state.overlaySvg.setAttribute("width", String(containerRect.width));
    state.overlaySvg.setAttribute("height", String(containerRect.height));

    // Clear and rebuild paragraph paths
    const pg = state.paragraphGroup;
    while (pg.firstChild) pg.removeChild(pg.firstChild);

    const textRects = SegmentHighlights.#getTextRects(highlightData.charMap, containerRect);
    for (const rect of textRects) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
      path.setAttribute("fill", PARAGRAPH_HIGHLIGHT_COLOR);
      pg.appendChild(path);
    }
  }

  static #addHighlights(uniqueId, self, segment, background) {
    for (const element of self.#highlightElements(segment)) {
      // Save original styles that we will modify
      const originalStyles = {
        position: element.style.position,
        isolation: element.style.isolation,
        cursor: element.style.cursor,
      };

      // Build highlight data BEFORE inserting overlay to avoid contaminating DOM measurements
      const highlightData = SegmentHighlights.#buildHighlightData(element, segment.words);
      SegmentHighlights.#activeHighlights.set(element, highlightData);

      // Establish positioning context for the overlay
      const computed = getComputedStyle(element);
      if (computed.position === "static") {
        element.style.position = "relative";
      }
      element.style.isolation = "isolate";

      const containerRect = element.getBoundingClientRect();

      // Account for border: absolute positioning starts at the padding box,
      // but containerRect is the border box. Offset the SVG so its origin
      // matches the border box origin used by our rect calculations.
      const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;

      // Create single overlay SVG (z-index: -1 places it behind normal-flow text)
      const overlaySvg = document.createElementNS(SVG_NS, "svg");
      overlaySvg.style.position = "absolute";
      overlaySvg.style.top = `${-borderTop}px`;
      overlaySvg.style.left = `${-borderLeft}px`;
      overlaySvg.style.zIndex = "-1";
      overlaySvg.style.pointerEvents = "none";
      overlaySvg.style.overflow = "visible";
      overlaySvg.setAttribute("width", String(containerRect.width));
      overlaySvg.setAttribute("height", String(containerRect.height));

      // Paragraph highlight group (rendered first → visually behind word highlight)
      const paragraphGroup = document.createElementNS(SVG_NS, "g");
      const textRects = SegmentHighlights.#getTextRects(highlightData.charMap, containerRect);
      for (const rect of textRects) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
        path.setAttribute("fill", PARAGRAPH_HIGHLIGHT_COLOR);
        paragraphGroup.appendChild(path);
      }
      overlaySvg.appendChild(paragraphGroup);

      // Single reusable word highlight rect (rendered second → visually above paragraph)
      const wordRect = document.createElementNS(SVG_NS, "rect");
      wordRect.setAttribute("rx", String(CORNER_RADIUS));
      wordRect.setAttribute("ry", String(CORNER_RADIUS));
      wordRect.setAttribute("fill", WORD_HIGHLIGHT_COLOR);
      wordRect.style.opacity = "0";
      wordRect.style.x = "0px";
      wordRect.style.y = "0px";
      wordRect.style.width = "0px";
      wordRect.style.height = "0px";
      wordRect.style.transition = [
        `x ${WORD_TRANSITION_MS}ms ease-out`,
        `y ${WORD_TRANSITION_MS}ms ease-out`,
        `width ${WORD_TRANSITION_MS}ms ease-out`,
        `height ${WORD_TRANSITION_MS}ms ease-out`,
        `opacity ${WORD_TRANSITION_MS}ms ease-out`,
      ].join(", ");
      overlaySvg.appendChild(wordRect);

      // Insert overlay as first child so it renders behind text content
      element.prepend(overlaySvg);

      // Store DOM references and cached dimensions for resize detection
      SegmentHighlights.#elementState.set(element, {
        uniqueId,
        originalStyles,
        segment,
        overlaySvg,
        paragraphGroup,
        wordRect,
        cachedWidth: containerRect.width,
        cachedHeight: containerRect.height,
      });

      // Restore word highlight position if we have saved state (e.g., after hover/unhover cycle).
      // This prevents the word rect from re-animating from (0,0) when the overlay is destroyed
      // and recreated by the mediator's ownership cycling.
      const savedWord = SegmentHighlights.#savedWordState.get(element);
      if (savedWord && savedWord.marker === segment.marker) {
        wordRect.style.transition = "none";
        wordRect.style.x = savedWord.x;
        wordRect.style.y = savedWord.y;
        wordRect.style.width = savedWord.width;
        wordRect.style.height = savedWord.height;
        wordRect.style.opacity = savedWord.opacity;
        // Force reflow so the position applies immediately before re-enabling transitions
        wordRect.getBoundingClientRect();
        wordRect.style.transition = [
          `x ${WORD_TRANSITION_MS}ms ease-out`,
          `y ${WORD_TRANSITION_MS}ms ease-out`,
          `width ${WORD_TRANSITION_MS}ms ease-out`,
          `height ${WORD_TRANSITION_MS}ms ease-out`,
          `opacity ${WORD_TRANSITION_MS}ms ease-out`,
        ].join(", ");
        highlightData.currentWordIndex = savedWord.currentWordIndex;
      }
      SegmentHighlights.#savedWordState.delete(element);

      // Add click handler for click-to-seek or pause
      element.style.cursor = "pointer";
      const clickHandler = (event) => {
        const hd = SegmentHighlights.#activeHighlights.get(element);
        if (!hd) return;

        const wordIndex = SegmentHighlights.#findWordAtPoint(event.clientX, event.clientY, hd, element);
        if (wordIndex >= 0) {
          // Check if clicking on the currently playing word (only pause if actively playing)
          const isCurrentWord = wordIndex === hd.currentWordIndex && hd.currentWordIndex >= 0;

          if (isCurrentWord && hd.isPlaying) {
            // Stop propagation so listenToSegments doesn't also toggle play/pause
            event.stopPropagation();

            // Pause playback
            element.dispatchEvent(new CustomEvent("beyondwords-pause", {
              detail: { segment },
              bubbles: true,
            }));
          } else {
            // Let the click propagate so listenToSegments fires PressedSegment,
            // which makes rootController play the correct content item / segment.
            // Then dispatch seek asynchronously so it runs AFTER rootController
            // has handled the segment switch.
            const word = hd.wordRanges[wordIndex];
            const segmentStartTime = segment.startTime || 0;
            const seekTime = segmentStartTime + (word.start_time / 1000);

            setTimeout(() => {
              element.dispatchEvent(new CustomEvent("beyondwords-seek", {
                detail: { time: seekTime, segment, word },
                bubbles: true,
              }));
            }, 0);
          }
        }
      };
      element.addEventListener("click", clickHandler);
      SegmentHighlights.#clickHandlers.set(element, clickHandler);
    }
  }

  static #removeHighlights(uniqueId, self, segment) {
    for (const element of self.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (state && state.uniqueId === uniqueId) {
        // Save word highlight state so it can be restored if the overlay is
        // immediately recreated (e.g., mediator cycling from hover/unhover).
        const highlightData = SegmentHighlights.#activeHighlights.get(element);
        if (highlightData && highlightData.currentWordIndex >= 0) {
          SegmentHighlights.#savedWordState.set(element, {
            marker: segment.marker,
            currentWordIndex: highlightData.currentWordIndex,
            x: state.wordRect.style.x,
            y: state.wordRect.style.y,
            width: state.wordRect.style.width,
            height: state.wordRect.style.height,
            opacity: state.wordRect.style.opacity,
          });
        } else {
          SegmentHighlights.#savedWordState.delete(element);
        }

        // Remove overlay SVG from DOM
        state.overlaySvg?.remove();

        // Restore original styles
        element.style.position = state.originalStyles.position;
        element.style.isolation = state.originalStyles.isolation;
        element.style.cursor = state.originalStyles.cursor;

        // Remove click handler
        const clickHandler = SegmentHighlights.#clickHandlers.get(element);
        if (clickHandler) {
          element.removeEventListener("click", clickHandler);
          SegmentHighlights.#clickHandlers.delete(element);
        }

        SegmentHighlights.#elementState.delete(element);
        SegmentHighlights.#activeHighlights.delete(element);
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
