import postcss from "postcss";

const prefixCssSelectors = (prefix) => ({
  name: "prefixCssSelectors",
  transform: (src, id) => {
    if (!id.endsWith(".css")) { return; }
    if (!id.includes("src/components")) { return; }

    return { code: applyPrefix(prefix, src) };
  }
});

const applyPrefix = (prefix, css) => (
  postcss([postcssPlugin(prefix)]).process(css).css
);

const postcssPlugin = (prefix) => (root) => {
  root.walkRules(r => r.selectors = r.selectors.map(s => newSelector(prefix, s)));
};

const newSelector = (prefix, selector) => {
  const isKeyframe = ["from", "to"].includes(selector) || selector.endsWith("%");
  if (isKeyframe) { return selector; }

  const isRoot = selector.startsWith(".beyondwords-player");
  return [prefix, isRoot ? "" : " ", selector].join("");
};

export default prefixCssSelectors;
