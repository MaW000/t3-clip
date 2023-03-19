/** @type {import("eslint").Linter.Config} */
const config = {

  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  extends: ["next/core-web-vitals",],

};

module.exports = config;
