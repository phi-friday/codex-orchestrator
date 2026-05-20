# AGENTS.md

Repository guidance for agentic coding agents.

## Project Snapshot

- This repository packages a Codex Orchestrator plugin, not a conventional app.
- The plugin goal is to help a parent Codex agent split independent work across subagents while the parent owns integration and verification.
- The plugin also ships an installer skill, non-interactive installer script, local browser wizard, JSON schema, and lifecycle hooks for the orchestrator workflow.
- Bun is used for local dependency management and verification, but repo skills and helper scripts should assume Node.js runtime semantics.
- There is currently no `src/` application entrypoint. `package.json` should not advertise runtime entrypoints unless the referenced files exist.
- Dependencies are locked by `bun.lock`; do not add npm/yarn/pnpm lockfiles.
- Plugin metadata versioning is checked by `scripts/version.ts`; keep generated README files and `.codex-plugin/plugin.json` in sync.

## Commands

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs --dry-run
                 # preview config-driven bundled subagent writes/removals
node plugins/codex-orchestrator/scripts/install-subagents.mjs
                 # install bundled subagent definitions from config
node plugins/codex-orchestrator/scripts/install-subagents-wizard.mjs
                 # start local browser interview for installer choices
bun install      # install local dev dependencies
bun run test     # bun test
bun run typecheck # tsc
bun run lint     # oxlint --config oxlint.config.ts
bun run format   # oxfmt --config oxfmt.config.ts; formats TS/JS, ignores Markdown
bun run version:check
                 # verify plugin version and rendered README files are in sync
bun run version patch
                 # bump plugin version and regenerate README files
bun run reference:oh-my-opencode-slim
                 # refresh the vendored reference snapshot version from package.json
```

## Test Conventions

- Repository tests are authored as TypeScript `.test.ts` files and run with Bun via `bun run test`.
- The test script covers `./plugins` and `./scripts` with Bun concurrency enabled.
- Installer tests should keep direct Node subprocess coverage for the documented `.mjs` CLI path.
- Wizard tests should verify local HTTP behavior without modifying real config or agent files.
- Hook tests should cover both direct hook logic and `hooks.json` command quoting.
- Importable installer utilities may be tested directly, but importing the installer module must not trigger CLI side effects.
- Test fixture files should use temporary directories and clean them up after each test.
- Run `bun run test`, `bun run typecheck`, `bun run lint`, and `bun run version:check` before claiming implementation completion.

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
| `plugins/codex-orchestrator/assets/subagents/*.toml` | Bundled Codex custom-agent templates containing installer placeholders |
| `plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json` | JSON schema for installer configuration |
| `plugins/codex-orchestrator/scripts/install-subagents.mjs` | Node CLI that renders TOML templates and writes subagent definitions |
| `plugins/codex-orchestrator/scripts/install-subagents-wizard.mjs` | Local browser interview wizard; collects answers but does not install |
| `plugins/codex-orchestrator/scripts/install-subagents.test.ts` | Bun TypeScript tests; keeps Node subprocess coverage for the installer CLI |
| `plugins/codex-orchestrator/scripts/install-subagents-wizard.test.ts` | Bun TypeScript tests for wizard state, HTML, HTTP submission, and CLI behavior |
| `plugins/codex-orchestrator/hooks/hooks.json` | Plugin hook registration for `UserPromptSubmit` and `Stop` |
| `plugins/codex-orchestrator/hooks/orchestrator-hook.mjs` | Node hook entrypoint that reads Codex hook JSON from stdin |
| `plugins/codex-orchestrator/hooks/orchestrator-enforcement.mjs` | Shared hook decision logic |
| `plugins/codex-orchestrator/hooks/orchestrator-enforcement.test.ts` | Hook behavior and hook configuration tests |
| `scripts/version.ts` | Version bump/check helper for plugin metadata and generated README files |
| `docs/templates/README.md` | English README template rendered by `bun run version` |
| `docs/templates/README.kr.md` | Korean README template rendered by `bun run version` |
| `package.json` | Script source of truth for test, typecheck, lint, format, and reference refresh commands |
| `tsconfig.json` | TypeScript checks run via `bun run typecheck` |
| `oxlint.config.ts` | Lint source of truth; not ESLint |
| `oxfmt.config.ts` | Format source of truth; not Prettier |
| `.codex/agents/*.toml` | Repository-local installed custom agents rendered from bundled templates |
| `.codex/skills/openspec-*` | OpenSpec change workflow lives here |
