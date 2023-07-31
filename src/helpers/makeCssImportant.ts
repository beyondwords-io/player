import MagicString from "magic-string";
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

const applyToInlineStyleTags = (src, path) => {
  if (!path.includes("src/components")) { return; }
  if (!path.endsWith(".svelte")) { return; }

  // TODO: error if already important

  const filename = path.replace(/^.*[\\/]/, "");
  const source = new MagicString(src, { filename });

  if (filename.includes("UserInterface.svelte")) {
    const expected = src.includes("set_style") && (src.includes("attr_dev") || src.includes("attr"));
    if (!expected) { throw new Error("Unable to makeCssImportant because Svelte's function names have changed."); }
  }

  source.prepend(`
    const _set_style = (node, k, v) => set_style(node, k, v, 1);
    const _attr_dev = (node, k, v) => attr_dev(node, k, k === "style" ? _important(v) : v);
    const _attr = (node, k, v) => attr(node, k, k === "style" ? _important(v) : v);

    const _css_regex = /;(?!([^()]*\\([^()]*\\))*[^()]*\\))/; // Match semicolons not inside parentheses.
    const _important = value => value.split(_css_regex).filter(s => s).map(s => s + " !important").join(";");
  `);

  source.replaceAll("set_style(", "_set_style(");
  source.replaceAll("attr_dev(", "_attr_dev(");
  source.replaceAll("attr(", "_attr(");

  const code = source.toString();
  const map = source.generateMap({ source: filename });

  return { code, map };
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
