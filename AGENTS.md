# AGENTS.md

Repository guidance for agentic coding agents.

## Project Snapshot

- This repository packages a Codex Orchestrator plugin, not a conventional app.
- The plugin goal is to help a parent Codex agent split independent work across subagents while the parent owns integration and verification.
- The plugin also ships an installer skill/script for rendering bundled subagent YAML templates from JSON configuration.
- Bun is used for local dependency management and verification, but repo skills and helper scripts should assume Node.js runtime semantics.
- There is currently no `src/` application entrypoint. `package.json` metadata may still contain Bun init leftovers such as `module: "index.ts"`.
- Dependencies are locked by `bun.lock`; do not add npm/yarn/pnpm lockfiles.

## Commands

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs --dry-run
                 # preview config-driven bundled subagent writes/removals
node plugins/codex-orchestrator/scripts/install-subagents.mjs
                 # install bundled subagent definitions from config
bun install      # install local dev dependencies
bun run test     # bun test
bun run typecheck # tsc
bun run lint     # oxlint --config oxlint.config.ts
bun run format   # oxfmt --config oxfmt.config.ts; formats TS/JS, ignores Markdown
```

## Test Conventions

- Repository tests are authored as TypeScript `.test.ts` files and run with Bun via `bun run test`.
- Installer tests should keep direct Node subprocess coverage for the documented `.mjs` CLI path.
- Importable installer utilities may be tested directly, but importing the installer module must not trigger CLI side effects.
- Test fixture files should use temporary directories and clean them up after each test.
- Run `bun run test`, `bun run typecheck`, and `bun run lint` before claiming implementation completion.

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
- `console` is intentionally allowed in plugin scripts and OXC config files.

## Files Agents Commonly Guess Wrong

| Path | Note |
|------|------|
| `plugins/codex-orchestrator/.codex-plugin/plugin.json` | Codex plugin metadata and skill registration source |
| `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` | Main orchestration skill; defines delegation rules and completion standard |
| `plugins/codex-orchestrator/skills/install-subagents/SKILL.md` | Installer skill; documents Node-based installation flow |
| `plugins/codex-orchestrator/assets/subagents/*.yaml` | Subagent templates containing `{{MODEL}}` placeholders |
| `plugins/codex-orchestrator/scripts/install-subagents.mjs` | Node CLI that renders YAML templates and writes subagent definitions |
| `plugins/codex-orchestrator/scripts/install-subagents.test.ts` | Bun TypeScript tests; keeps Node subprocess coverage for the installer CLI |
| `package.json` | Only `test`, `typecheck`, `lint`, and `format` scripts are defined |
| `tsconfig.json` | TypeScript checks run via `bun run typecheck` |
| `oxlint.config.ts` | Lint source of truth; not ESLint |
| `oxfmt.config.ts` | Format source of truth; not Prettier |
| `.opencode/commands/opsx-explore.md` | Explore workflow is read/search/thinking only, no edits |
| `.opencode/skills/openspec-*` | OpenSpec change workflow lives here |
