import postcss from "postcss";
import throwError from "./throwError";

const makeCssImportant = () => ({
  name: "makeCssImportant",
  transform: async (src, id) => {
    if (!id.endsWith(".css")) { return; }
    if (!id.includes("src/components")) { return; }

    const options = { from: id, map: { inline: false, prev: false, annotation: false } };
    const result = await postcss([postcssPlugin]).process(src, options);

    return { code: result.css, map: result.map.toJSON() };
  }
});

const postcssPlugin = (root) => {
  root.walkRules(r => r.nodes = r.nodes.map(n => newNode(n)));
};

const newNode = (node) => {
  if (node.important) {
    throwError([
      "The styles should not use !important because it will be ignored.",
      "We are using !important to prevent website styles interfering with the player.",
    ], {
      selector: node.parent.selector,
      prop: node.prop,
      value: node.value,
      important: true,
    });
  }

  return { ...node, important: true };
};

export default makeCssImportant;
