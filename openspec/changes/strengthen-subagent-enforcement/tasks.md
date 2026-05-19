## 1. Skill Guidance

- [ ] 1.1 Update `codex-orchestrator` skill wording from delegation-as-economics to subagent-first execution for applicable substantive work.
- [ ] 1.2 Add narrow local-only exception rules for explicit opt-out, unavailable specialists, trivial direct commands, exact known-file lookups, and immediately blocking critical-path work.
- [ ] 1.3 Require at least one bounded read-only specialist for repository investigation, review, broad discovery, planning-heavy analysis, and multi-file summarization when a suitable subagent is available.
- [ ] 1.4 Update specialist routing sections so matching available specialists are the expected path, not merely an optional net-gain path.
- [ ] 1.5 Update communication and completion guidance so local-only execution reports a concrete allowed reason.

## 2. Hook Enforcement

- [ ] 2.1 Strengthen `ORCHESTRATOR_CONTEXT` to instruct subagent spawning by default and list allowed local-only exceptions.
- [ ] 2.2 Expand prompt applicability coverage for planning, proposal, design, investigation, review, and verification phrasing.
- [ ] 2.3 Add completion detection for messages that lack both delegation evidence and an allowed local-only reason.
- [ ] 2.4 Keep the Stop hook loop-safe and preserve explicit opt-out and non-coding allowances.

## 3. Plugin Defaults

- [ ] 3.1 Review `.codex-plugin/plugin.json` default prompt and strengthen it if needed so plugin metadata matches the subagent-first contract.
- [ ] 3.2 Confirm repository-local `codex-orchestrator.json` does not need install-time default changes because bundled subagents are already enabled.

## 4. Tests and Verification

- [ ] 4.1 Update hook tests for strengthened UserPromptSubmit context and broader applicability.
- [ ] 4.2 Add Stop hook tests for completion with delegation evidence, allowed local-only reasons, and missing delegation evidence.
- [ ] 4.3 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
- [ ] 4.4 Run OpenSpec validation/status checks for `strengthen-subagent-enforcement`.
