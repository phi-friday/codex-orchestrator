## 1. Orchestrator Skill Guidance

- [x] 1.1 Update the availability rule in `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` to require one session-scoped bundled subagent availability check before the first orchestration routing decision.
- [x] 1.2 Add guidance that missing expected bundled subagents trigger `install-subagents` use or recommendation once per Codex session, followed by available specialist or fallback routing.
- [x] 1.3 Update workflow/delegation gate wording so later routing decisions use the remembered availability result and do not repeatedly trigger installation unless the user explicitly asks to install or refresh.
- [x] 1.4 Add parent-owned subagent lifecycle cleanup to the completion standard, using Codex-managed subagent thread terminology rather than OS process terminology.

## 2. Hook Enforcement

- [x] 2.1 Update `plugins/codex-orchestrator/.codex-plugin/plugin.json` default prompt so it no longer unconditionally tells every session to use `$install-subagents`.
- [x] 2.2 Update `plugins/codex-orchestrator/hooks/orchestrator-enforcement.mjs` context and Stop hook logic to recognize cleanup evidence for delegated subagent work.
- [x] 2.3 Add Stop hook blocking behavior for completion claims that mention delegated subagent work without cleanup evidence or an explicit unsupported-cleanup limitation.
- [x] 2.4 Keep Stop hook behavior loop-safe when `stop_hook_active` is true and avoid requiring cleanup evidence for allowed local-only completions.
- [x] 2.5 Ensure hook wording describes closing, stopping, or releasing Codex-managed subagent threads and does not claim OS process termination.

## 3. Tests and Verification

- [x] 3.1 Add hook unit tests for delegated completion with cleanup evidence, delegated completion with unsupported cleanup limitation, and delegated completion missing cleanup evidence.
- [x] 3.2 Update existing hook tests for changed default context and completion-guard wording.
- [x] 3.3 Manually review the final orchestrator skill against both delta specs to confirm session-scoped install guidance and cleanup requirements are covered.
- [x] 3.4 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
