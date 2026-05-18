import type { OxlintConfig } from "oxlint";
import { defineConfig } from "oxlint";

const typescript_recommended: string[] = [
  "typescript/ban-ts-comment",
  "typescript/no-array-constructor",
  "typescript/no-duplicate-enum-values",
  "typescript/no-empty-object-type",
  "typescript/no-explicit-any",
  "typescript/no-extra-non-null-assertion",
  "typescript/no-misused-new",
  "typescript/no-namespace",
  "typescript/no-non-null-asserted-optional-chain",
  "typescript/no-require-imports",
  "typescript/no-this-alias",
  "typescript/no-unnecessary-type-constraint",
  "typescript/no-unsafe-declaration-merging",
  "typescript/no-unsafe-function-type",
  "typescript/no-unused-expressions",
  "typescript/no-unused-vars",
  "typescript/no-wrapper-object-types",
  "typescript/prefer-as-const",
  "typescript/prefer-namespace-keyword",
  "typescript/triple-slash-reference",
];

const config: OxlintConfig = defineConfig({
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: "error",
  },
  plugins: ["eslint", "unicorn", "typescript", "oxc", "import", "jsdoc", "promise", "node"],
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "warn",
    perf: "warn",
    style: "off",
    restriction: "warn",
  },
  globals: {},
  ignorePatterns: [
    "**/dist/**",
    "**/dist-ssr/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.legacy.*",
    ".agents/**",
    ".codex/**",
    ".opencode/**",
    ".serena/**",
    "openspec/**",
  ],
  rules: {
    // oxc
    "oxc/no-async-await": "off",
    "oxc/no-optional-chaining": "off",
    "oxc/no-rest-spread-properties": "off",
    // import
    "import/max-dependencies": "off",
    "import/no-default-export": "off",
    "import/no-unassigned-import": [
      "error",
      {
        allow: ["**/*.css", "**/*.scss", "core-js/stable/**"],
      },
    ],
    "import/no-named-as-default": "off",
    "import/no-duplicates": "error",
    "import/first": "error",
    "import/no-relative-parent-imports": "error",
    // unicorn
    "unicorn/prefer-at": "off",
    "unicorn/require-module-specifiers": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-array-reverse": "off",
    "unicorn/no-typeof-undefined": "off",
    "unicorn/prefer-string-replace-all": "off",
    // jsdoc
    "jsdoc/require-property-description": "off",
    "jsdoc/no-defaults": "off",
    "jsdoc/require-param": "off",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns": "off",
    "jsdoc/require-returns-description": "off",
    // eslint
    "eslint/sort-vars": "off",
    "eslint/max-lines": ["error", { max: 1000 }],
    "eslint/max-lines-per-function": [
      "error",
      {
        IIFEs: false,
        max: 100,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    "eslint/no-useless-return": "off",
    "eslint/no-inline-comments": "off",
    "eslint/no-warning-comments": "off",
    "eslint/no-param-reassign": "error",
    "eslint/no-undefined": "off",
    "eslint/no-void": "off",
    "eslint/no-use-before-define": "off",
    "eslint/no-promise-executor-return": "off",
    // typescript
    // oxlint-disable-next-line unicorn/no-useless-spread
    ...{
      ...Object.fromEntries(typescript_recommended.map(rule => [rule, "error"])),
    },
    "typescript/strict-boolean-expressions": "off",
    "typescript/only-throw-error": "off",
    "typescript/switch-exhaustiveness-check": [
      "error",
      {
        considerDefaultExhaustiveForUnions: true,
      },
    ],
    "typescript/explicit-function-return-type": [
      "error",
      {
        allowIIFEs: true,
      },
    ],
    "typescript/no-deprecated": "error",
    "typescript/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
        disallowTypeAnnotations: false,
      },
    ],
    "typescript/no-import-type-side-effects": "error",
    "typescript/promise-function-async": "off",
    "typescript/return-await": "off",
    "typescript/prefer-nullish-coalescing": "off",
    "typescript/no-unsafe-type-assertion": "off",
    "typescript/restrict-template-expressions": "off",
    "typescript/no-unsafe-argument": "off",
    "typescript/no-unsafe-assignment": "off",
    "typescript/no-unsafe-return": "off",
    "typescript/no-unsafe-call": "off",
    "typescript/no-unsafe-member-access": "off",
    "typescript/no-misused-promises": "off",
    "typescript/no-confusing-void-expression": "off",
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/strict-void-return": "off",
    "typescript/no-unnecessary-type-arguments": "off",
    "typescript/no-floating-promises": "off",
    "typescript/prefer-promise-reject-errors": "off",
    // promise
    "promise/always-return": "off",
  },
  settings: {
    jsdoc: {
      ignorePrivate: false,
      ignoreInternal: false,
      ignoreReplacesDocs: true,
      overrideReplacesDocs: true,
      augmentsExtendsReplacesDocs: false,
      implementsReplacesDocs: false,
      exemptDestructuredRootsFromChecks: false,
    },
  },
  env: {
    builtin: true,
    browser: true,
    node: true,
  },
  overrides: [
    {
      files: ["src/**", "oxlint.config.*", "oxfmt.config.*"],
      rules: {
        "eslint/no-console": "off",
        "no-process-env": "off",
        "no-process-exit": "off",
        "no-default-export": "off",
        "import/no-relative-parent-imports": "off",
      },
    },
  ],
});

export default config;
