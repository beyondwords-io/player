module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:svelte/recommended"
  ],
  "globals": {
    "google": "readonly"
  },
  "overrides": [
    {
      "files": ["**/*.svelte"],
      "parser": "svelte-eslint-parser",
      "parserOptions": {
        "parser": "@typescript-eslint/parser",
      },
    }
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "eqeqeq": ["error", "always"],
    "@typescript-eslint/no-empty-function": [
      "error", { "allow": ["arrowFunctions", "methods"] }
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn", { "argsIgnorePattern": "_" }
    ],
    "svelte/no-at-html-tags": 0, // allow `@html` in templates
    "svelte/valid-compile": 0, // allow `export let unused = ...`
  },
  "settings": {
    "svelte3/typescript": true
  }
};
