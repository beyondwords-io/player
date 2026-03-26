import js from "@eslint/js";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        google: "readonly",
        BeyondWords: "readonly",
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.svelte"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["test/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
  {
    rules: {
      "indent": ["error", 2],
      "linebreak-style": ["error", "unix"],
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "eqeqeq": ["error", "always"],
      "@typescript-eslint/no-empty-function": [
        "error", { "allow": ["arrowFunctions", "methods"] }
      ],
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn", { "argsIgnorePattern": "_", "caughtErrors": "none" }
      ],
      "svelte/no-at-html-tags": "off",
      "svelte/valid-compile": "off",
      "svelte/no-unused-svelte-ignore": "off",
      "svelte/require-each-key": "off",
      "svelte/no-reactive-reassign": "off",
      "svelte/no-immutable-reactive-statements": "off",
      "svelte/infinite-reactive-loop": "off",
      "svelte/no-reactive-literals": "off",
      "svelte/no-reactive-functions": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
);
