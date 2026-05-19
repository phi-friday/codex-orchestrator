## Why

Codex Orchestrator is intended to make subagent delegation the normal operating
mode for substantive coding-agent work, but the current guidance leaves too much
room for the parent agent to treat local execution as the default. This causes
repository investigation, review, and multi-step work to bypass available
specialists even when the user did not opt out.

## What Changes

- Strengthen the `codex-orchestrator` skill so available subagents are actively
  used by default for substantive repository work.
- Narrow the local-only exception to explicit opt-out, unavailable matching
  subagents, truly trivial commands, or tasks where delegation would block the
  immediate critical path.
- Require the parent to spawn at least one bounded read-only specialist for
  repository investigation, review, multi-file analysis, broad search, or
  planning-heavy work when a suitable subagent is available.
- Require stronger stop-time completion checks that treat missing delegation
  evidence as incomplete for applicable work unless the assistant reports a
  concrete allowed reason for local-only execution.
- Keep parent-owned integration and verification: subagents gather, analyze, or
  implement bounded lanes, while the parent remains responsible for synthesis
  and final checks.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `orchestrator-skill-guidance`: Make subagent usage the expected default for
  substantive work and make local-only execution a narrow, explainable
  exception.
- `orchestrator-hook-enforcement`: Strengthen injected hook context and
  completion guarding so applicable work must show delegation use or an allowed
  reason for not delegating.

## Impact

- `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`
- `plugins/codex-orchestrator/.codex-plugin/plugin.json`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.mjs`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.test.ts`
- `openspec/specs/orchestrator-skill-guidance/spec.md`
- `openspec/specs/orchestrator-hook-enforcement/spec.md`
