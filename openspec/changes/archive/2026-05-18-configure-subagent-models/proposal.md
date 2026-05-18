## Why

Codex Orchestrator currently installs every bundled subagent with one shared
model, which prevents users from matching model choice to each subagent's role.
The installer also always defaults to the global agent directory, even when a
repository-local configuration should produce repository-local subagent files.

## What Changes

- **BREAKING** Remove the `--model` installer option.
- Add JSON configuration files that define subagent models by agent name.
- Load configuration from global, repository-local, and explicit config files
  using deterministic precedence.
- Treat `model: null` or a missing model as a disabled bundled subagent.
- Delete previously installed bundled subagent files when the final config
  disables them.
- Require `--target-dir` when `--config` is provided.
- Derive the default target directory from the effective non-explicit config
  source: repository-local config installs to `<cwd>/.codex/agents`, while
  global-only config installs to `~/.codex/agents`.
- Fail when no configuration file is available.

## Capabilities

### New Capabilities

- `subagent-configuration`: Defines how bundled subagent definitions are
  installed, disabled, removed, and targeted from Codex Orchestrator
  configuration files.

### Modified Capabilities

None.

## Impact

- `plugins/codex-orchestrator/scripts/install-subagents.mjs`
- `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`
- `AGENTS.md`
- Bundled subagent template installation behavior
- Installer CLI usage and error handling
