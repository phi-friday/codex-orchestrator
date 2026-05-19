## 1. Source Review

- [ ] 1.1 Re-read `references/oh-my-opencode-slim/src/agents/orchestrator.ts` and extract the workflow, delegation gate, routing descriptions, validation routing, parallel examples, communication rules, and `buildOrchestratorPrompt(disabledAgents)` filtering behavior.
- [ ] 1.2 Review `createOrchestratorAgent()`, `resolvePrompt()`, and related agent/config files to confirm which behavior is static prompt content versus runtime branching or configuration behavior.
- [ ] 1.3 Review source README/codemap material for observer, especially default-disabled status, vision-capable model guidance, full-path delegation, and context-isolation rationale.

## 2. Skill Rewrite

- [ ] 2.1 Replace the body of `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` wholesale while preserving valid skill frontmatter metadata.
- [ ] 2.2 Add Codex-native role and workflow guidance covering understand, path selection by quality/speed/cost/reliability, delegation check, split/parallelize, execute, integrate, validate, and verify.
- [ ] 2.3 Add availability-aware routing for bundled custom subagents: `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, and `observer`.
- [ ] 2.4 Add fallback routing for sessions where bundled custom subagents are unavailable, using Codex `explorer`, `worker`, `default`, or local parent work as appropriate.
- [ ] 2.5 Add observer-specific instructions: read-only visual/media analysis, full file paths, concise structured observations, raw-media context isolation, optional availability, and no fabricated visual findings.
- [ ] 2.6 Add self-contained delegation prompt templates for read-only analysis, implementation, and visual/media analysis.
- [ ] 2.7 Add parent-owned completion guidance requiring review of subagent outputs, integration, conflict handling, and relevant verification before reporting completion.

## 3. Translation Cleanup

- [ ] 3.1 Remove or translate OpenCode-only instructions such as `@agentName`, `subtask`, `read_session`, `auto_continue`, multiplexer behavior, and OpenCode session reuse into Codex-appropriate guidance.
- [ ] 3.2 Ensure the skill tells agents to check actual subagent availability before routing, reflecting the source `disabledAgents` filtering behavior in a static Codex skill.
- [ ] 3.3 Ensure the final prose is concise enough to be useful as a skill while retaining the source orchestrator's operating judgment.

## 4. Verification

- [ ] 4.1 Manually inspect the rewritten skill against `openspec/changes/rewrite-codex-orchestrator-skill/specs/orchestrator-skill-guidance/spec.md`.
- [ ] 4.2 Run `bun run test`, `bun run typecheck`, and `bun run lint` unless the Markdown-only change clearly has no applicable runtime impact; if skipped, record the reason.
- [ ] 4.3 Run `openspec status --change rewrite-codex-orchestrator-skill` and confirm the change is ready for implementation tracking.
