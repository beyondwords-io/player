import { resolve } from "path"
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { version } from "./package.json";
import fixRequireJsIssue from "./src/helpers/fixRequireJsIssue";
import makeCssImportant from "./src/helpers/makeCssImportant";
import prefixCssSelectors from "./src/helpers/prefixCssSelectors";

export default defineConfig({
  plugins: [
    fixRequireJsIssue(),
    svelte({ emitCss: true, compilerOptions: { accessors: true } }),
    makeCssImportant({ type: "inline-styles" }),
    makeCssImportant({ type: "style-tags" }),
    prefixCssSelectors(".bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp"),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "_beyond_words_player",
      fileName: format => `${format}.js`,
    },
    sourcemap: true,
    target: "es2015",
    rollupOptions: {
      external: [/hls.light.min.js/, /loadTheStyles.ts/],
      output: {
        banner: `/*! version:"${version}" */`,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    reporter: "dot",
    include: ["test/**/*.test*"],
    exclude: ["test/features"],
  },
});
