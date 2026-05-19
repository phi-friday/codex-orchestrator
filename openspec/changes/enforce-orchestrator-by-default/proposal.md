## Why

The bundled orchestrator currently depends on explicit user invocation or model
judgment, so it can be skipped even when subagent orchestration would materially
improve a coding task. The plugin should make orchestration the default behavior
for applicable work, while still honoring explicit user requests not to use it.

## What Changes

- Strengthen the `codex-orchestrator` skill description so Codex is more likely
  to select it for coding, debugging, review, research, verification, and
  multi-step repository work.
- Add plugin lifecycle hooks that inject orchestrator guidance for applicable
  prompts unless the user explicitly says not to use orchestration or subagents.
- Add hook scripts and configuration under the plugin bundle, and register them
  from `.codex-plugin/plugin.json`.
- Document that plugin hooks require Codex plugin hook support to be enabled by
  the user or environment.
- Add tests covering the hook decision logic, including opt-out detection.

## Capabilities

### New Capabilities

- `orchestrator-hook-enforcement`: Defines hook-driven behavior that nudges or
  continues Codex toward orchestrator usage by default for applicable work.

### Modified Capabilities

- `orchestrator-skill-guidance`: Strengthen the skill selection contract so the
  orchestrator applies by default unless the user explicitly opts out.

## Impact

- Affects `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`.
- Affects `plugins/codex-orchestrator/.codex-plugin/plugin.json`.
- Adds plugin hook configuration and hook scripts under
  `plugins/codex-orchestrator/hooks/`.
- Adds tests for hook behavior under `plugins/codex-orchestrator/scripts/` or a
  dedicated hook test location.
- May require users to enable Codex plugin hooks with `[features].plugin_hooks =
  true` for runtime hook behavior to run.
