import postcss from "postcss";

const prefixCssSelectors = (prefix) => ({
  name: "prefixCssSelectors",
  transform: async (src, id) => {
    if (!id.endsWith(".css")) { return; }
    if (!id.includes("src/components")) { return; }

    const options = { from: id, map: { inline: false, prev: false, annotation: false } };
    const result = await postcss([postcssPlugin(prefix)]).process(src, options);

    return { code: result.css, map: result.map.toJSON() };
  }
});

const postcssPlugin = (prefix) => (root) => {
  root.walkRules(r => r.selectors = r.selectors.map(s => newSelector(prefix, r, s)));
};

const newSelector = (prefix, rule, selector) => {
  const isKeyframe = ["from", "to"].includes(selector) || selector.endsWith("%");
  if (isKeyframe) { return selector; }

  const isTopLevel = selector.startsWith(".beyondwords-");

  if (isTopLevel) {
    return `${prefix}${selector}`;
  } else {
    return `${prefix} ${selector}`;
  }
};

export default prefixCssSelectors;
