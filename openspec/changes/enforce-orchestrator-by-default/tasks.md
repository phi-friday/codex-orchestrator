## 1. Skill Selection Contract

- [ ] 1.1 Update `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` frontmatter description to make the skill mandatory-by-default for substantive coding-agent work.
- [ ] 1.2 Add body guidance that explicit user opt-out overrides default orchestrator usage.
- [ ] 1.3 Add body guidance that tiny/local tasks still pass through the orchestrator decision gate even when no subagent is spawned.

## 2. Hook Registration

- [ ] 2.1 Add bundled hook configuration under `plugins/codex-orchestrator/hooks/hooks.json`.
- [ ] 2.2 Register the bundled hook configuration from `plugins/codex-orchestrator/.codex-plugin/plugin.json`.
- [ ] 2.3 Document the `[features].plugin_hooks = true` requirement in an appropriate plugin-facing document or skill note.

## 3. Hook Implementation

- [ ] 3.1 Add an importable Node module for prompt applicability, explicit opt-out detection, and UserPromptSubmit output generation.
- [ ] 3.2 Add a thin command hook CLI that reads Codex hook JSON from stdin and writes valid Codex hook JSON only when orchestration context should be injected.
- [ ] 3.3 If adding Stop hook support, implement loop-safe continuation logic that respects `stop_hook_active`.
- [ ] 3.4 Ensure hook scripts use Node.js runtime semantics and avoid adding new package lockfiles or runtime dependencies.

## 4. Tests

- [ ] 4.1 Add unit tests for applicable coding prompts, repository investigation prompts, and multi-step work prompts.
- [ ] 4.2 Add unit tests proving explicit opt-out prompts do not emit orchestrator-enforcement context.
- [ ] 4.3 Add CLI subprocess tests for representative UserPromptSubmit hook input and output.
- [ ] 4.4 If Stop hook support is implemented, add tests for loop prevention and narrow continuation behavior.

## 5. Verification

- [ ] 5.1 Run `bun run test`.
- [ ] 5.2 Run `bun run typecheck`.
- [ ] 5.3 Run `bun run lint`.
- [ ] 5.4 Run `openspec status --change enforce-orchestrator-by-default` and confirm implementation readiness or task completion status.
