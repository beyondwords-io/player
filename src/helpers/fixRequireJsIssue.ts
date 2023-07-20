import MagicString from "magic-string";

const fixRequireJsIssue = () => ({
  name: "fixRequireJsIssue",
  enforce: "pre",
  transform: (src, path) => {
    const filter = /node_modules\/.*\.[jt]sx?/;
    if (!path.match(filter)) { return; }

    const filename = path.replace(/^.*[\\/]/, "");
    const source = new MagicString(src, { filename });

    source.prepend("var define = false;\n");

    const code = source.toString();
    const map = source.generateMap({ source: filename });

    return { code, map };
  },
});

export default fixRequireJsIssue;
