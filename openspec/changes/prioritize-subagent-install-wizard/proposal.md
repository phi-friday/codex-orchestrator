## Why

Agents using the `install-subagents` skill still tend to run
`install-subagents.mjs` directly and treat the local install wizard as optional.
This bypasses the intended structured interview path and weakens the safety
model for configuration and target-directory choices.

## What Changes

- Make the local install wizard the required first interview path whenever it is
  available, suitable, and the user can open the reported local URL.
- Require agents to document or discuss a concrete fallback reason before using
  the chat interview path.
- Clarify that `install-subagents.mjs`, including `--dry-run`, runs only after
  wizard-submitted answers or a completed fallback chat interview.
- Update plugin prompt and skill guidance so the wizard-first rule is visible
  before direct installer commands.
- Add regression coverage that prevents the skill documentation from drifting
  back to a direct-installer-first flow.

## Capabilities

### New Capabilities

### Modified Capabilities

- `subagent-configuration`: Strengthen agent-driven installation requirements
  so the wizard is the primary interview mechanism and direct installer use is
  gated by wizard answers or an explicit fallback path.

## Impact

- `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`
- `plugins/codex-orchestrator/.codex-plugin/plugin.json`
- `plugins/codex-orchestrator/scripts/install-subagents.test.ts`
- `openspec/specs/subagent-configuration/spec.md`
