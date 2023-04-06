import postcss from "postcss";

const prefixCssSelectors = (className, times) => ({
  name: "prefixCssSelectors",
  transform: async (src, id) => {
    if (!id.endsWith(".css")) { return; }
    if (!id.includes("src/components")) { return; }

    const options = { from: id, map: { inline: false, prev: false, annotation: false } };
    const result = await postcss([postcssPlugin(className, times)]).process(src, options);

    return { code: result.css, map: result.map.toJSON() };
  }
});

const postcssPlugin = (className, times) => (root) => {
  root.walkRules(r => r.selectors = r.selectors.map(s => newSelector(className, times, r, s)));
};

const newSelector = (className, times, rule, selector) => {
  const isKeyframe = ["from", "to"].includes(selector) || selector.endsWith("%");
  if (isKeyframe) { return selector; }

  const isRoot = selector.startsWith(".beyondwords-player");
  const isHighlight = selector.startsWith(".beyondwords-highlight");
  const isClickable = selector.startsWith(".beyondwords-clickable");

  // Make the style reset rule lower precedence than the other styles.
  const isReset = rule.nodes.some(n => n.prop === "all");
  const prefix = className.repeat(isReset ? times - 1 : times);

  if (isRoot || isHighlight || isClickable) {
    return `${prefix}${selector}`;
  } else {
    return `${prefix} ${selector}`;
  }
};

export default prefixCssSelectors;
