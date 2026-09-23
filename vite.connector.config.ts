import { resolve } from "node:path";
import { defineConfig } from "vite";
import { version } from "./package.json";

export default defineConfig(({ mode }) => {
  const browser = mode === "browser";

  return {
    publicDir: false,
    build: {
      // The player build owns dist/. A connector-only rebuild must preserve it.
      emptyOutDir: false,
      target: "es2015",
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, browser ? "src/connector/browser.ts" : "src/connector/index.ts"),
        name: "_beyond_words_connector",
        formats: [browser ? "iife" : "es"],
        fileName: () => browser ? "connector.js" : "connector.mjs",
      },
      rollupOptions: {
        output: { banner: `/*! BeyondWords Connector version:"${version}" */` },
      },
    },
  };
});
