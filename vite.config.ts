import { resolve } from "path"
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import makeCssImportant from "./src/helpers/makeCssImportant";
import prefixCssSelectors from "./src/helpers/prefixCssSelectors";
import inlineCssIntoScript from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    svelte({ emitCss: true, compilerOptions: { accessors: true } }),
    makeCssImportant(),
    prefixCssSelectors(".bwp".repeat(12)),
    inlineCssIntoScript(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "BeyondWords",
      fileName: format => `${format}.js`,
    },
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    reporter: "dot",
    include: ["test/**/*.test*"],
    exclude: ["test/features"],
  },
});
