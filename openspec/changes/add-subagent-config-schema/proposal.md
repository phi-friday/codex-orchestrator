## Why

Codex Orchestrator configuration is user-authored JSON, but the repository does
not ship a JSON Schema that editors and users can rely on. The installer also
accepts any string for `model_reasoning_effort`, which makes typos look valid
until Codex consumes the rendered custom agent file.

## What Changes

- Add a bundled JSON Schema asset for `codex-orchestrator.json` under the
  plugin assets tree.
- Document use of the schema from user configuration files.
- Validate `model_reasoning_effort` against the supported Codex reasoning effort
  values: `low`, `medium`, `high`, and `xhigh`.
- Preserve `null` as the way to remove an inherited reasoning effort override.
- Avoid JavaScript enum constructs in the installer; use shared allowed-value
  constants instead.

## Capabilities

### New Capabilities

### Modified Capabilities

- `subagent-configuration`: Add the public JSON Schema contract and restrict
  accepted `model_reasoning_effort` string values.

## Impact

- Affects `plugins/codex-orchestrator/assets/schemas/`.
- Affects `plugins/codex-orchestrator/scripts/install-subagents.mjs`.
- Affects `plugins/codex-orchestrator/scripts/install-subagents.test.ts`.
- Affects `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`.
