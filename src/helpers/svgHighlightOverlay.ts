import { buildCharMap, buildWordRanges, getTextRects, getRangeRects } from "./highlightTextMap";
import getWordHighlightAnimation from "./wordHighlightAnimations";

const CORNER_RADIUS = 3;
const SVG_NS = "http://www.w3.org/2000/svg";

const elementState = new WeakMap();
const activeElements = new Set();
let resizeRafId = 0;

const roundedRectPath = (x, y, width, height, r) => {
  return `M${x + r},${y} h${width - 2 * r} q${r},0 ${r},${r} v${height - 2 * r} q0,${r} -${r},${r} h-${width - 2 * r} q-${r},0 -${r},-${r} v-${height - 2 * r} q0,-${r} ${r},-${r} z`;
};

const buildParagraphPaths = (charMap, containerRect, background, group) => {
  for (const rect of getTextRects(charMap, containerRect)) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
    path.setAttribute("fill", background);
    group.appendChild(path);
  }
};

const handleResizeThrottled = () => {
  cancelAnimationFrame(resizeRafId);
  resizeRafId = requestAnimationFrame(handleResize);
};

const handleResize = () => {
  const animation = getWordHighlightAnimation();

  for (const element of activeElements) {
    const state = elementState.get(element);
    if (!state) continue;

    const containerRect = element.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) continue;

    state.overlaySvg.setAttribute("width", String(containerRect.width));
    state.overlaySvg.setAttribute("height", String(containerRect.height));
    const pg = state.paragraphGroup;
    while (pg.firstChild) pg.removeChild(pg.firstChild);
    buildParagraphPaths(state.charMap, containerRect, state.background, pg);

    const wordIndex = state.currentWordIndex;
    if (wordIndex >= 0 && wordIndex < state.wordRanges.length) {
      const word = state.wordRanges[wordIndex];
      const wordRects = getRangeRects(state.charMap, word.startIndex, word.endIndex, containerRect);
      if (wordRects.length > 0) {
        animation.show(state.wordGroup, wordRects);
      }
    }
  }
};

const updateResizeListener = () => {
  if (activeElements.size > 0) {
    addEventListener("resize", handleResizeThrottled);
  } else {
    removeEventListener("resize", handleResizeThrottled);
    cancelAnimationFrame(resizeRafId);
  }
};

const create = (element, uniqueId, background, wordHighlightColor, words) => {
  const containerRect = element.getBoundingClientRect();
  if (containerRect.width === 0 || containerRect.height === 0) return false;

  const originalStyles = {
    position: element.style.position,
    isolation: element.style.isolation,
  };

  try {
    const { charMap, normalizedText } = buildCharMap(element);
    const wordRanges = buildWordRanges(normalizedText, words);

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
    buildParagraphPaths(charMap, containerRect, background, paragraphGroup);
    overlaySvg.appendChild(paragraphGroup);

    const wordGroup = document.createElementNS(SVG_NS, "g");
    wordGroup.style.opacity = "0";
    wordGroup.style.transition = "opacity 120ms ease-out";
    wordGroup.setAttribute("data-rx", String(CORNER_RADIUS));
    wordGroup.setAttribute("data-ry", String(CORNER_RADIUS));
    wordGroup.setAttribute("data-fill", wordHighlightColor);
    overlaySvg.appendChild(wordGroup);

    element.prepend(overlaySvg);

    elementState.set(element, {
      uniqueId,
      background,
      originalStyles,
      overlaySvg,
      paragraphGroup,
      wordGroup,
      charMap,
      wordRanges,
      currentWordIndex: -1,
    });

    activeElements.add(element);
    updateResizeListener();
    return true;
  } catch (e) {
    element.style.position = originalStyles.position;
    element.style.isolation = originalStyles.isolation;
    return false;
  }
};

const remove = (element, uniqueId) => {
  const state = elementState.get(element);
  if (!state || state.uniqueId !== uniqueId) return false;

  state.overlaySvg?.remove();
  element.style.position = state.originalStyles.position;
  element.style.isolation = state.originalStyles.isolation;

  elementState.delete(element);
  activeElements.delete(element);
  updateResizeListener();
  return true;
};

const getState = (element) => elementState.get(element);

export { create, remove, getState };
