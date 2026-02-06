import { ESLint } from "eslint";

/** @type {ESLint.FlatConfigArray} */
const config = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        browser: true,
        node: true,
      },
    },
    rules: {},
  },
];

export default config;