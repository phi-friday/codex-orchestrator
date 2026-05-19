# Tech Stack

- Package manager and test runner: Bun; lockfile is `bun.lock` only. Do not add npm/yarn/pnpm lockfiles.
- Repo scripts and plugin helper scripts should assume Node.js runtime semantics where documented; installer CLI is `.mjs` and invoked with `node`.
- TypeScript is strict with Bun types, bundler resolution, preserved modules, `allowImportingTsExtensions`, `verbatimModuleSyntax`, and `noEmit`.
- Linting: `oxlint --config oxlint.config.ts` with type-aware rules.
- Formatting: `oxfmt --config oxfmt.config.ts`; formats TS/JS and ignores Markdown.