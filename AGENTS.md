# AGENTS.md

Repository guidance for agentic coding agents.

## Project Snapshot

- Bun + pure TypeScript ESM. No Svelte, Python, ESLint, or Prettier in this repo.
- Current real source entrypoint is `src/index.ts`; README/package metadata still mention `index.ts`, but no root `index.ts` exists.
- Dependencies are locked by `bun.lock`; do not add npm/yarn/pnpm lockfiles.

## Commands

```bash
bun install      # install deps
bun run lint     # oxlint --config oxlint.config.ts
bun run format   # oxfmt --config oxfmt.config.ts; formats TS/JS, ignores Markdown
```

## TypeScript Conventions

- Strict TS is enabled with Bun types, bundler resolution, preserved modules, `allowImportingTsExtensions`, `verbatimModuleSyntax`, and `noEmit`.
- `oxlint` is type-aware and enforces explicit function return types, `consistent-type-imports`, no explicit `any`, exhaustive switches, duplicate imports, no param reassignment, and max 100 lines per function.
- Formatting follows the referenced frontend conventions: 2 spaces, 100 columns, double quotes, semicolons, ES5 trailing commas, omit parens for single-arg arrows.
- Naming follows the referenced `ylw-open-webui/src/AGENTS.md` TS rules where applicable:
  - `PascalCase`: TS types/interfaces/classes.
  - `camelCase`: functions and arrow functions.
  - `snake_case`: local variables and local state-like bindings.
  - `UPPER_CASE`: module-level immutable primitive constants.
  - `_` prefix: private/internal values and intentionally unused variables.
- `console` is intentionally allowed in `src/**` and OXC config files.

## Files Agents Commonly Guess Wrong

| Path | Note |
|------|------|
| `src/index.ts` | Only current app source file |
| `package.json` | Only `lint` and `format` scripts are defined |
| `tsconfig.json` | TypeScript checks are configured, but no `typecheck` script exists |
| `oxlint.config.ts` | Lint source of truth; not ESLint |
| `oxfmt.config.ts` | Format source of truth; not Prettier |
| `.opencode/commands/opsx-explore.md` | Explore workflow is read/search/thinking only, no edits |
| `.opencode/skills/openspec-*` | OpenSpec change workflow lives here |
