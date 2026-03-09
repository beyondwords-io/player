// Each animation strategy controls how the word highlight group behaves.
// A word highlight is a <g> element containing one or more <rect> children
// (multiple rects when a word breaks across lines). Opacity is controlled on
// the group; position/size transitions are on individual rects.
//
// To add a new style, define an object implementing these 5 methods and
// register it in the ANIMATIONS map below.

interface Rect { x: number; y: number; width: number; height: number }

interface WordHighlightAnimation {
  // Configure a single rect element (transitions, initial attributes)
  setupRect(rect: SVGRectElement): void;
  // Show the word group with the given rects (creates/removes child rects as needed)
  show(group: SVGGElement, rects: Rect[]): void;
  // Hide the word group when no word is active
  hide(group: SVGGElement): void;
  // Capture group state before the overlay is destroyed (hover/unhover cycle)
  save(group: SVGGElement): Record<string, string>[];
  // Restore saved state instantly (no animation) after overlay is recreated
  restore(group: SVGGElement, saved: Record<string, string>[]): void;
}

const TRANSITION_MS = 120;
const rectTransition = ["x", "y", "width", "height"]
  .map(p => `${p} ${TRANSITION_MS}ms ease-out`).join(", ");
const groupTransition = `opacity ${TRANSITION_MS}ms ease-out`;

const defaultAnimation: WordHighlightAnimation = {
  setupRect(rect) {
    rect.style.x = "0px";
    rect.style.y = "0px";
    rect.style.width = "0px";
    rect.style.height = "0px";
    rect.style.transition = rectTransition;
  },

  show(group, rects) {
    const children = group.children;

    // Add or update rects
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

  save(group) {
    const saved: Record<string, string>[] = [];
    saved.push({ opacity: group.style.opacity });
    for (const rect of group.children) {
      const r = rect as SVGRectElement;
      saved.push({ x: r.style.x, y: r.style.y, width: r.style.width, height: r.style.height });
    }
    return saved;
  },

  restore(group, saved) {
    if (!saved.length) return;

    group.style.transition = "none";
    group.style.opacity = saved[0].opacity;

    // Remove existing children and recreate from saved state
    while (group.firstChild) group.removeChild(group.firstChild);
    for (let i = 1; i < saved.length; i++) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("rx", group.getAttribute("data-rx") || "3");
      rect.setAttribute("ry", group.getAttribute("data-ry") || "3");
      rect.setAttribute("fill", group.getAttribute("data-fill") || "");
      rect.style.transition = "none";
      Object.assign(rect.style, saved[i]);
      group.appendChild(rect);
    }

    group.getBoundingClientRect(); // force reflow
    group.style.transition = groupTransition;
    for (const rect of group.children) {
      (rect as SVGRectElement).style.transition = rectTransition;
    }
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
