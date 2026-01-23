import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";

// Hardcoded word-level timing data (from API response structure)
const WORD_TIMINGS = [
  { text: "A", start_time: 50, duration: 113 },
  { text: "recent", start_time: 175, duration: 425 },
  { text: "report", start_time: 613, duration: 475 },
  { text: "by", start_time: 1100, duration: 138 },
  { text: "the", start_time: 1250, duration: 88 },
  { text: "Boston", start_time: 1350, duration: 488 },
  { text: "Consulting", start_time: 1850, duration: 600 },
  { text: "Group", start_time: 2463, duration: 238 },
  { text: "highlights", start_time: 2713, duration: 650 },
  { text: "that", start_time: 3375, duration: 150 },
  { text: "New", start_time: 3538, duration: 125 },
  { text: "Zealand's", start_time: 3675, duration: 338 },
  { text: "gas", start_time: 4025, duration: 300 },
  { text: "supply", start_time: 4338, duration: 413 },
  { text: "could", start_time: 4763, duration: 263 },
  { text: "potentially", start_time: 5038, duration: 675 },
  { text: "halve", start_time: 5725, duration: 338 },
  { text: "again", start_time: 6075, duration: 400 },
  { text: "in", start_time: 6488, duration: 75 },
  { text: "the", start_time: 6575, duration: 75 },
  { text: "next", start_time: 6663, duration: 263 },
  { text: "five", start_time: 6938, duration: 350 },
  { text: "years,", start_time: 7300, duration: 688 },
  { text: "emphasizing", start_time: 8000, duration: 750 },
  { text: "the", start_time: 8763, duration: 88 },
  { text: "need", start_time: 8863, duration: 300 },
  { text: "for", start_time: 9175, duration: 163 },
  { text: "immediate", start_time: 9350, duration: 563 },
  { text: "intervention", start_time: 9925, duration: 713 },
  { text: "to", start_time: 10650, duration: 163 },
  { text: "secure", start_time: 10825, duration: 438 },
  { text: "remaining", start_time: 11275, duration: 550 },
  { text: "resources.", start_time: 11838, duration: 913 },
  { text: "The", start_time: 13000, duration: 150 },
  { text: "report", start_time: 13163, duration: 363 },
  { text: "notes", start_time: 13538, duration: 363 },
  { text: "that", start_time: 13913, duration: 150 },
  { text: "New", start_time: 14075, duration: 138 },
  { text: "Zealand's", start_time: 14225, duration: 350 },
  { text: "gas", start_time: 14588, duration: 288 },
  { text: "supply", start_time: 14888, duration: 413 },
  { text: "has", start_time: 15313, duration: 250 },
  { text: "already", start_time: 15575, duration: 550 },
  { text: "decreased", start_time: 16138, duration: 538 },
  { text: "by", start_time: 16688, duration: 150 },
  { text: "50%", start_time: 16850, duration: 938 },
  { text: "since", start_time: 17800, duration: 611 },
  { text: "2015,", start_time: 18411, duration: 914 },
  { text: "with", start_time: 19325, duration: 100 },
  { text: "prices", start_time: 19438, duration: 475 },
  { text: "more", start_time: 19925, duration: 200 },
  { text: "than", start_time: 20138, duration: 163 },
  { text: "doubling", start_time: 20313, duration: 438 },
  { text: "during", start_time: 20763, duration: 288 },
  { text: "that", start_time: 21063, duration: 200 },
  { text: "time,", start_time: 21275, duration: 613 },
  { text: "contributing", start_time: 21888, duration: 675 },
  { text: "to", start_time: 22575, duration: 113 },
  { text: "last", start_time: 22700, duration: 425 },
  { text: "year's", start_time: 23138, duration: 238 },
  { text: "significant", start_time: 23388, duration: 688 },
  { text: "spike", start_time: 24088, duration: 488 },
  { text: "in", start_time: 24588, duration: 163 },
  { text: "power", start_time: 24763, duration: 350 },
  { text: "prices.", start_time: 25125, duration: 875 },
  { text: "Factors", start_time: 26250, duration: 513 },
  { text: "such", start_time: 26775, duration: 288 },
  { text: "as", start_time: 27075, duration: 188 },
  { text: "the", start_time: 27275, duration: 125 },
  { text: "decline", start_time: 27413, duration: 463 },
  { text: "of", start_time: 27888, duration: 138 },
  { text: "aging", start_time: 28038, duration: 425 },
  { text: "offshore", start_time: 28475, duration: 463 },
  { text: "fields", start_time: 28950, duration: 538 },
  { text: "and", start_time: 29500, duration: 200 },
  { text: "the", start_time: 29713, duration: 113 },
  { text: "potential", start_time: 29838, duration: 575 },
  { text: "exit", start_time: 30425, duration: 475 },
  { text: "of", start_time: 30913, duration: 138 },
  { text: "major", start_time: 31063, duration: 350 },
  { text: "gas", start_time: 31425, duration: 350 },
  { text: "users", start_time: 31788, duration: 475 },
  { text: "are", start_time: 32275, duration: 100 },
  { text: "expected", start_time: 32388, duration: 675 },
  { text: "to", start_time: 33075, duration: 175 },
  { text: "continue", start_time: 33263, duration: 550 },
  { text: "pressuring", start_time: 33825, duration: 613 },
  { text: "both", start_time: 34450, duration: 350 },
  { text: "gas", start_time: 34813, duration: 413 },
  { text: "and", start_time: 35238, duration: 275 },
  { text: "electricity", start_time: 35525, duration: 800 },
  { text: "affordability", start_time: 36338, duration: 888 },
  { text: "and", start_time: 37238, duration: 163 },
  { text: "security.", start_time: 37413, duration: 925 },
];

// SVG highlight colors
const PARAGRAPH_HIGHLIGHT_COLOR = "#D2E3FC";
const WORD_HIGHLIGHT_COLOR = "#8AB4F8";
const CORNER_RADIUS = 3;

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);
  static #elementState = new WeakMap();
  static #activeHighlights = new Map(); // Track active highlights for word updates
  static #clickHandlers = new WeakMap(); // Track click handlers for cleanup

  constructor() {
    this.ids = new SegmentIdGenerator();
    this.onEvent = null; // Will be set to emit events for seeking
  }

  update(type, segment, sections, background, currentTime = 0, isPlaying = false) {
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    if (current) {
      SegmentHighlights.#mediator.addInterest(current, this, this, segment, background);
      // Update word highlighting based on current time
      this.#updateWordHighlight(segment, currentTime, isPlaying);
    }
    if (previous && previous !== current) {
      SegmentHighlights.#mediator.removeInterest(previous, this);
    }

    this[`prev${type}`] = current;
  }

  reset(type) {
    this.update(type, null, ["none"], null, 0, false);
  }

  // Update word highlighting for active segment based on current playback time
  #updateWordHighlight(segment, currentTime, isPlaying) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime || 0; // in seconds
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000; // convert to ms relative to segment start

    for (const element of this.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state) continue;

      // Get or create highlight data
      let highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) {
        highlightData = SegmentHighlights.#buildHighlightData(element);
        SegmentHighlights.#activeHighlights.set(element, highlightData);
      }

      const containerRect = element.getBoundingClientRect();
      const currentWordIndex = SegmentHighlights.#findCurrentWordIndex(timeInSegmentMs, highlightData.wordRanges);

      // Store playing state for click handler
      highlightData.isPlaying = isPlaying;

      SegmentHighlights.#applyHighlights(element, highlightData, containerRect, currentWordIndex);
    }
  }

  // Build highlight data: character map and word ranges computed from DOM
  static #buildHighlightData(element) {
    const charMap = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let fullText = "";

    // Build character map and full text
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, offset: i });
        fullText += text[i];
      }
    }

    // Normalize: find where actual content starts (skip leading whitespace)
    const trimmedText = fullText.replace(/^\s+/, "");
    const leadingWhitespace = fullText.length - trimmedText.length;

    // Compute word ranges by finding each word in the DOM text
    const wordRanges = [];
    let searchPos = leadingWhitespace;

    for (const wordTiming of WORD_TIMINGS) {
      const wordText = wordTiming.text;
      const foundPos = fullText.indexOf(wordText, searchPos);

      if (foundPos !== -1) {
        wordRanges.push({
          start_index: foundPos,
          end_index: foundPos + wordText.length,
          start_time: wordTiming.start_time,
          duration: wordTiming.duration,
          text: wordText,
        });
        searchPos = foundPos + wordText.length;
      }
    }

    return { charMap, wordRanges };
  }

  // Get word range for a specific word index
  static #getWordRange(highlightData, wordIndex) {
    if (wordIndex < 0 || wordIndex >= highlightData.wordRanges.length) {
      return null;
    }
    return highlightData.wordRanges[wordIndex];
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

  // Get all line rects for the entire text content
  static #getParagraphRects(element, containerRect) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = Array.from(range.getClientRects());

    return rects.map(rect => ({
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

  // Generate SVG for paragraph background (all lines)
  static #generateParagraphSvg(rects, width, height, color) {
    if (rects.length === 0) return "";

    const paths = rects.map(rect =>
      SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS)
    ).join(" ");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
           width="${width}" height="${height}"
           viewBox="0 0 ${width} ${height}">
        <style>path { fill: ${color}; }</style>
        <path d="${paths}" />
      </svg>`;
  }

  // Generate SVG for word highlight
  static #generateWordSvg(rects, width, height, color) {
    if (rects.length === 0) return "";

    const paths = rects.map(rect =>
      SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS)
    ).join(" ");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
           width="${width}" height="${height}"
           viewBox="0 0 ${width} ${height}">
        <style>path { fill: ${color}; }</style>
        <path d="${paths}" />
      </svg>`;
  }

  // Convert SVG to base64 data URL
  static #svgToDataUrl(svg) {
    const encoded = btoa(svg.trim());
    return `data:image/svg+xml;base64,${encoded}`;
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

  // Apply SVG background highlights to element
  static #applyHighlights(element, highlightData, containerRect, currentWordIndex) {
    const width = containerRect.width;
    const height = containerRect.height;
    const { charMap, wordRanges } = highlightData;

    // Store current word index for click handler to check
    highlightData.currentWordIndex = currentWordIndex;

    // Get paragraph rects
    const paragraphRects = SegmentHighlights.#getParagraphRects(element, containerRect);
    const paragraphSvg = SegmentHighlights.#generateParagraphSvg(
      paragraphRects, width, height, PARAGRAPH_HIGHLIGHT_COLOR
    );
    const paragraphUrl = SegmentHighlights.#svgToDataUrl(paragraphSvg);

    let backgroundStyle = `url("${paragraphUrl}") no-repeat border-box border-box`;

    // Add word highlight if we have a current word
    if (currentWordIndex >= 0 && currentWordIndex < wordRanges.length) {
      const currentWord = wordRanges[currentWordIndex];
      const wordRects = SegmentHighlights.#getRangeRects(
        charMap, currentWord.start_index, currentWord.end_index, containerRect
      );
      if (wordRects.length > 0) {
        const wordSvg = SegmentHighlights.#generateWordSvg(
          wordRects, width, height, WORD_HIGHLIGHT_COLOR
        );
        const wordUrl = SegmentHighlights.#svgToDataUrl(wordSvg);
        // Word highlight goes on top (first in the list)
        backgroundStyle = `url("${wordUrl}") no-repeat border-box border-box, ${backgroundStyle}`;
      }
    }

    backgroundStyle += ", none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0)";

    element.style.color = "rgb(0, 0, 0)";
    element.style.background = backgroundStyle;
  }

  static #addHighlights(uniqueId, self, segment, background) {
    for (const element of self.#highlightElements(segment)) {
      // Store original styles
      const originalStyles = {
        color: element.style.color,
        background: element.style.background,
        cursor: element.style.cursor,
      };
      SegmentHighlights.#elementState.set(element, { uniqueId, originalStyles, segment });

      // Build highlight data for the element and cache it
      const highlightData = SegmentHighlights.#buildHighlightData(element);
      SegmentHighlights.#activeHighlights.set(element, highlightData);

      const containerRect = element.getBoundingClientRect();

      // Apply initial paragraph highlight (word will be updated via #updateWordHighlight)
      SegmentHighlights.#applyHighlights(element, highlightData, containerRect, -1);

      // Add click handler for click-to-seek or pause
      element.style.cursor = "pointer";
      const clickHandler = (event) => {
        const highlightData = SegmentHighlights.#activeHighlights.get(element);
        if (!highlightData) return;

        const wordIndex = SegmentHighlights.#findWordAtPoint(event.clientX, event.clientY, highlightData, element);
        if (wordIndex >= 0) {
          // Stop propagation to prevent listenToSegments from also handling this click
          // (which would trigger the old play/pause toggle logic in rootController)
          event.stopPropagation();

          // Check if clicking on the currently playing word (only pause if actively playing)
          const isCurrentWord = wordIndex === highlightData.currentWordIndex && highlightData.currentWordIndex >= 0;

          if (isCurrentWord && highlightData.isPlaying) {
            // Pause playback
            const pauseEvent = new CustomEvent("beyondwords-pause", {
              detail: { segment },
              bubbles: true,
            });
            element.dispatchEvent(pauseEvent);
          } else {
            // Seek to the clicked word and play
            const word = highlightData.wordRanges[wordIndex];
            const segmentStartTime = segment.startTime || 0;
            // Seek to word start time (convert ms to seconds and add segment offset)
            const seekTime = segmentStartTime + (word.start_time / 1000);

            // Emit seek event via custom event on document
            const seekEvent = new CustomEvent("beyondwords-seek", {
              detail: { time: seekTime, segment, word },
              bubbles: true,
            });
            element.dispatchEvent(seekEvent);
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
        // Restore original styles
        element.style.color = state.originalStyles.color;
        element.style.background = state.originalStyles.background;
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
