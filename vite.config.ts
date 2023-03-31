import { resolve } from "path"
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import cssInJs from "vite-plugin-css-injected-by-js";
import prefixCss from "./src/helpers/prefixCssSelectors";

export default defineConfig({
  plugins: [
    svelte({ emitCss: true, compilerOptions: { accessors: true } }),
    prefixCss(".bwp".repeat(12)),
    cssInJs(),
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
