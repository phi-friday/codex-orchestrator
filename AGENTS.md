# AGENTS.md

Repository guidance for agentic coding agents.

## Project Snapshot

- This repository packages a Codex Orchestrator plugin, not a conventional app.
- The plugin goal is to help a parent Codex agent split independent work across subagents while the parent owns integration and verification.
- The plugin also ships an installer skill/script for rendering bundled subagent YAML templates with a selected model.
- Bun is used for local dependency management and verification, but repo skills and helper scripts should assume Node.js runtime semantics.
- There is currently no `src/` application entrypoint. `package.json` metadata may still contain Bun init leftovers such as `module: "index.ts"`.
- Dependencies are locked by `bun.lock`; do not add npm/yarn/pnpm lockfiles.

## Commands

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs --model gpt-5.4 --dry-run
                 # preview bundled subagent install output
node plugins/codex-orchestrator/scripts/install-subagents.mjs --model gpt-5.4
                 # install bundled subagent definitions to ~/.codex/agents
bun install      # install local dev dependencies
bun run typecheck # tsc
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
- `console` is intentionally allowed in plugin scripts and OXC config files.

## Files Agents Commonly Guess Wrong

| Path | Note |
|------|------|
| `plugins/codex-orchestrator/.codex-plugin/plugin.json` | Codex plugin metadata and skill registration source |
| `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` | Main orchestration skill; defines delegation rules and completion standard |
| `plugins/codex-orchestrator/skills/install-subagents/SKILL.md` | Installer skill; documents Node-based installation flow |
| `plugins/codex-orchestrator/assets/subagents/*.yaml` | Subagent templates containing `{{MODEL}}` placeholders |
| `plugins/codex-orchestrator/scripts/install-subagents.mjs` | Node CLI that renders YAML templates and writes subagent definitions |
| `package.json` | Only `typecheck`, `lint`, and `format` scripts are defined |
| `tsconfig.json` | TypeScript checks run via `bun run typecheck` |
| `oxlint.config.ts` | Lint source of truth; not ESLint |
| `oxfmt.config.ts` | Format source of truth; not Prettier |
| `.opencode/commands/opsx-explore.md` | Explore workflow is read/search/thinking only, no edits |
| `.opencode/skills/openspec-*` | OpenSpec change workflow lives here |
