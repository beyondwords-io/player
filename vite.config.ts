import { resolve } from "path"
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "BeyondWords",
      fileName: format => `${format}.js`,
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
