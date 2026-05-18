## Why

Bundled subagent templates currently hard-code `model_reasoning_effort`, so users
cannot choose per-agent reasoning effort or omit the override entirely. The
installer already uses per-agent JSON configuration for `model`, making reasoning
effort the next natural field to configure through the same mechanism.

## What Changes

- Add per-agent `model_reasoning_effort` support to Codex Orchestrator JSON
  configuration.
- Render `model_reasoning_effort` into bundled TOML output only when the final
  per-agent configuration provides a non-empty string value.
- Treat `model_reasoning_effort: null` as an explicit removal of an inherited
  reasoning effort override.
- Remove fixed `model_reasoning_effort` values from bundled templates so omitted
  reasoning effort leaves Codex's default behavior in control.
- **BREAKING**: Rendered bundled subagents no longer contain
  `model_reasoning_effort` unless configured.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `subagent-configuration`: Add configuration-driven reasoning effort rendering
  and allow omitted or null reasoning effort to omit the TOML field.

## Impact

- Affects `plugins/codex-orchestrator/scripts/install-subagents.mjs`.
- Affects bundled subagent templates in
  `plugins/codex-orchestrator/assets/subagents/*.toml`.
- Affects installer tests and template quality tests under
  `plugins/codex-orchestrator/scripts/`.
- Affects `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`.
