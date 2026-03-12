// Each animation strategy controls how the word highlight group behaves.
// A word highlight is a <g> element containing one or more <rect> children
// (multiple rects when a word breaks across lines). Opacity is controlled on
// the group; position/size transitions are on individual rects.
//
// To add a new style, define an object implementing these methods and
// register it in the ANIMATIONS map below.

interface Rect { x: number; y: number; width: number; height: number }

interface WordHighlightAnimation {
  show(group: SVGGElement, rects: Rect[]): void;
  hide(group: SVGGElement): void;
}

const TRANSITION_MS = 120;
const rectTransition = ["x", "y", "width", "height"]
  .map(p => `${p} ${TRANSITION_MS}ms ease-out`).join(", ");

const defaultAnimation: WordHighlightAnimation = {
  show(group, rects) {
    const children = group.children;

    for (let i = 0; i < rects.length; i++) {
      let rect = children[i] as SVGRectElement;
      if (!rect) {
        rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("rx", group.getAttribute("data-rx") || "3");
        rect.setAttribute("ry", group.getAttribute("data-ry") || "3");
        rect.setAttribute("fill", group.getAttribute("data-fill") || "");
        // No position transition for newly created rects (avoid animating from 0,0)
        rect.style.x = `${rects[i].x}px`;
        rect.style.y = `${rects[i].y}px`;
        rect.style.width = `${rects[i].width}px`;
        rect.style.height = `${rects[i].height}px`;
        rect.getBoundingClientRect();
        rect.style.transition = rectTransition;
        group.appendChild(rect);
      } else {
        rect.style.x = `${rects[i].x}px`;
        rect.style.y = `${rects[i].y}px`;
        rect.style.width = `${rects[i].width}px`;
        rect.style.height = `${rects[i].height}px`;
      }
    }

    // Remove extra rects
    while (children.length > rects.length) {
      group.removeChild(children[children.length - 1]);
    }

    group.style.opacity = "1";
  },

  hide(group) {
    group.style.opacity = "0";
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
