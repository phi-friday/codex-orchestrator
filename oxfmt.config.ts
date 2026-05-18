import type { OxfmtConfig } from "oxfmt";
import { defineConfig } from "oxfmt";

const config: OxfmtConfig = defineConfig({
  printWidth: 100,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: "es5",
  arrowParens: "avoid",
  bracketSpacing: true,
  useTabs: false,
  singleAttributePerLine: false,
  bracketSameLine: false,
  jsxSingleQuote: false,
  quoteProps: "as-needed",
  semi: true,
  ignorePatterns: ["**/*.md", "references/**"],
});

export default config;
