## Why

The orchestrator workflow currently treats missing bundled subagents primarily as
a fallback condition and does not require explicit cleanup reporting for spawned
Codex-managed agent threads. This can lead to repeated install prompts, unclear
availability decisions, and completed subagent threads being left open longer
than needed.

## What Changes

- Add session-scoped bundled subagent availability guidance to the
  `codex-orchestrator` skill.
- Require the parent to use or recommend `install-subagents` once when expected
  bundled agents are missing at first orchestration use, then avoid repeated
  installation triggers in the same Codex session unless the user explicitly
  asks to install or refresh.
- Require parent-owned lifecycle cleanup for completed, failed, obsolete, or
  no-longer-needed Codex-managed subagent threads when the runtime exposes a
  close/stop mechanism.
- Strengthen the Stop hook completion guard so completion after delegation must
  report subagent cleanup or the absence of a supported cleanup mechanism.
- Avoid unsupported claims that subagents are OS processes; describe them as
  Codex-managed agent threads.

## Capabilities

### New Capabilities

### Modified Capabilities
- `orchestrator-skill-guidance`: Add session-scoped bundled subagent availability checks, one-time install-subagents guidance, and subagent lifecycle cleanup requirements.
- `orchestrator-hook-enforcement`: Add stop-time enforcement that completion after delegation includes subagent cleanup evidence or an explicit cleanup limitation.

## Impact

- `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`
- `plugins/codex-orchestrator/.codex-plugin/plugin.json`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.mjs`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.test.ts`
- `openspec/specs/orchestrator-skill-guidance/spec.md`
- `openspec/specs/orchestrator-hook-enforcement/spec.md`
