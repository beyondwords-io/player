import postcss from "postcss";
import throwError from "./throwError";

const makeCssImportant = ({ type }) => {
  const name = `makeCssImportant ${type}`;

  if (type === "inline-styles") {
    return { name, transform: applyToInlineStyleTags };
  } else {
    return { name, transform: applyToExternalCssFiles };
  }
};

const applyToInlineStyleTags = (src, id) => {
  if (!id.includes("src/components")) { return; }
  if (!id.endsWith(".svelte")) { return; }

  // TODO: error if already important
  // TODO: check that svelte function names haven't changed by looking for them in UserInterface.svelte (error otherwise)

  const code = `
    const _set_style = (node, k, v) => set_style(node, k, v, 1);
    const _attr_dev = (node, k, v) => attr_dev(node, k, k === "style" ? _important(v) : v);
    const _important = value => value.split(";").map(s => s + " !important").join(";");

    ${src.replaceAll("set_style(", "_set_style(").replaceAll("attr_dev(", "_attr_dev(")}
  `;

  return { code, map: null }; // TODO: use magic-string
};

const applyToExternalCssFiles = async (src, id) => {
  if (!id.includes("src/components")) { return; }
  if (!id.endsWith(".css")) { return; }

  const options = { from: id, map: { inline: false, prev: false, annotation: false } };
  const result = await postcss([postcssPlugin]).process(src, options);

  return { code: result.css, map: result.map.toJSON() };
};

const postcssPlugin = (root) => {
  root.walkRules(r => r.nodes = r.nodes.map(n => newNode(n, r.selector)));
};

const newNode = (node, selector) => {
  const isKeyframe = ["from", "to"].includes(selector) || selector.endsWith("%");
  if (isKeyframe) { return node; }

  const isExcluded = node.raws.value?.raw.includes("~!important");
  if (isExcluded) { return node; }

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
