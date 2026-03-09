// Each animation strategy controls how the word highlight rect behaves.
// To add a new style, define an object implementing these 5 methods and
// register it in the ANIMATIONS map below.

interface Rect { x: number; y: number; width: number; height: number }

interface WordHighlightAnimation {
  // Configure the SVG rect element (transitions, initial attributes, etc.)
  setup(wordRect: SVGRectElement): void;
  // Animate the rect to the given word position
  show(wordRect: SVGRectElement, rect: Rect): void;
  // Animate the rect out when no word is active
  hide(wordRect: SVGRectElement): void;
  // Capture rect state before the overlay is destroyed (hover/unhover cycle)
  save(wordRect: SVGRectElement): Record<string, string>;
  // Restore saved state instantly (no animation) after overlay is recreated
  restore(wordRect: SVGRectElement, saved: Record<string, string>): void;
}

const TRANSITION_MS = 120;
const transitionValue = ["x", "y", "width", "height", "opacity"]
  .map(p => `${p} ${TRANSITION_MS}ms ease-out`).join(", ");

const defaultAnimation: WordHighlightAnimation = {
  setup(wordRect) {
    wordRect.style.opacity = "0";
    wordRect.style.x = "0px";
    wordRect.style.y = "0px";
    wordRect.style.width = "0px";
    wordRect.style.height = "0px";
    wordRect.style.transition = transitionValue;
  },

  show(wordRect, rect) {
    wordRect.style.x = `${rect.x}px`;
    wordRect.style.y = `${rect.y}px`;
    wordRect.style.width = `${rect.width}px`;
    wordRect.style.height = `${rect.height}px`;
    wordRect.style.opacity = "1";
  },

  hide(wordRect) {
    wordRect.style.opacity = "0";
  },

  save(wordRect) {
    return {
      x: wordRect.style.x,
      y: wordRect.style.y,
      width: wordRect.style.width,
      height: wordRect.style.height,
      opacity: wordRect.style.opacity,
    };
  },

  restore(wordRect, saved) {
    wordRect.style.transition = "none";
    Object.assign(wordRect.style, saved);
    wordRect.getBoundingClientRect(); // force reflow before re-enabling transitions
    wordRect.style.transition = transitionValue;
  },
};

const ANIMATIONS: Record<string, WordHighlightAnimation> = {
  default: defaultAnimation,
};

const getWordHighlightAnimation = (name = "default"): WordHighlightAnimation => {
  return ANIMATIONS[name] || ANIMATIONS.default;
};

export default getWordHighlightAnimation;
export { WordHighlightAnimation };
