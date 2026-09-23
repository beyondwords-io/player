import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  compilerOptions: { accessors: true },
  preprocess: vitePreprocess(),
};
