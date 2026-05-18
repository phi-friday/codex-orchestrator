## Why

The bundled subagent definitions are placeholder YAML samples and do not match
Codex custom agent configuration. The plugin needs real Codex-oriented
specialist agents derived from the OpenCode reference roles while avoiding
OpenCode-only tool assumptions.

## What Changes

- **BREAKING**: Replace the bundled YAML subagent templates with Codex TOML
  custom agent templates.
- Remove the dummy `codebase-explorer` and `implementation-worker` bundled
  agents.
- Add bundled TOML templates for `designer`, `orchestrator-explorer`, `fixer`,
  `librarian`, `observer`, and `oracle`.
- Use Codex custom agent fields including `name`, `description`, `model`,
  fixed `model_reasoning_effort`, `sandbox_mode` where appropriate, and
  `developer_instructions`.
- Make `librarian` self-contained by configuring the Context7 MCP server in its
  template.
- Add source provenance comments to each bundled TOML template identifying the
  referenced `oh-my-opencode-slim` version, commit, and source agent file.
- Update installer behavior, tests, and documentation from YAML/instructions
  terminology to TOML/developer_instructions terminology.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `subagent-configuration`: Bundled subagent templates change from placeholder
  YAML files to Codex-compatible TOML custom agent definitions for the six
  orchestrator roles.

## Impact

- `plugins/codex-orchestrator/assets/subagents/`
- `plugins/codex-orchestrator/scripts/install-subagents.mjs`
- `plugins/codex-orchestrator/scripts/install-subagents.test.ts`
- `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`
- `openspec/specs/subagent-configuration/spec.md`
