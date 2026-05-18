## 1. Installer CLI and Config Loading

- [x] 1.1 Remove `--model` from the installer CLI, usage text, and option parsing.
- [x] 1.2 Add `--config <path>` parsing while keeping `--asset-dir`, `--target-dir`, `--dry-run`, and `--help`.
- [x] 1.3 Implement config discovery for global, repository-local, and explicit config paths.
- [x] 1.4 Fail with a clear error when no config file is available.
- [x] 1.5 Require `--target-dir` when `--config` is provided.

## 2. Config Semantics

- [x] 2.1 Parse JSON config with an `agents` object containing per-agent `model` values.
- [x] 2.2 Merge configs by precedence so higher-priority agent fields override lower-priority fields.
- [x] 2.3 Treat `model: null` as an explicit disable that overrides inherited model values.
- [x] 2.4 Warn about configured agent names that do not match bundled templates.

## 3. Install, Disable, and Target Behavior

- [x] 3.1 Determine default target directory as `<cwd>/.codex/agents` when repository config is used without `--config`.
- [x] 3.2 Determine default target directory as `~/.codex/agents` when only global config is used without `--config`.
- [x] 3.3 Render and write bundled templates only when the final agent model is a non-empty string.
- [x] 3.4 Remove disabled bundled subagent files from the target directory when present.
- [x] 3.5 Keep dry-run mode side-effect free while reporting planned writes and planned removals.

## 4. Documentation and Verification

- [x] 4.1 Update `plugins/codex-orchestrator/skills/install-subagents/SKILL.md` with the new config file format and CLI usage.
- [x] 4.2 Update `AGENTS.md` command examples to remove `--model` and describe config-driven installation.
- [x] 4.3 Add or update focused verification coverage for config precedence, null disable, target-dir defaults, missing config failure, and dry-run output.
- [x] 4.4 Run `bun run typecheck` and `bun run lint`.
