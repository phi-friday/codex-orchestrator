## 1. Source Review

- [x] 1.1 Re-read `references/oh-my-opencode-slim/src/agents/orchestrator.ts` and extract the workflow, delegation gate, routing descriptions, validation routing, parallel examples, communication rules, and `buildOrchestratorPrompt(disabledAgents)` filtering behavior.
- [x] 1.2 Review `createOrchestratorAgent()`, `resolvePrompt()`, and related agent/config files to confirm which behavior is static prompt content versus runtime branching or configuration behavior.
- [x] 1.3 Review source README/codemap material for observer, especially default-disabled status, vision-capable model guidance, full-path delegation, and context-isolation rationale.

## 2. Skill Rewrite

- [x] 2.1 Replace the body of `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` wholesale while preserving valid skill frontmatter metadata.
- [x] 2.2 Add Codex-native role and workflow guidance covering understand, path selection by quality/speed/cost/reliability, delegation check, split/parallelize, execute, integrate, validate, and verify.
- [x] 2.3 Add availability-aware routing for bundled custom subagents: `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, and `observer`.
- [x] 2.4 Add fallback routing for sessions where bundled custom subagents are unavailable, using concrete Codex runtime roles such as `explorer` or `worker` when available and appropriate, otherwise local parent work.
- [x] 2.5 Add observer-specific instructions: read-only visual/media analysis, full file paths, concise structured observations, raw-media context isolation, optional availability, and no fabricated visual findings.
- [x] 2.6 Add self-contained delegation prompt templates for read-only analysis, implementation, and visual/media analysis.
- [x] 2.7 Add parent-owned completion guidance requiring review of subagent outputs, integration, conflict handling, and relevant verification before reporting completion.

## 3. Translation Cleanup

- [x] 3.1 Translate only OpenCode-specific instructions that map cleanly to Codex, and omit unsupported runtime behavior such as `read_session`, `auto_continue`, multiplexer behavior, task-session manager behavior, council, and session reuse.
- [x] 3.2 Ensure the skill tells agents to check actual subagent availability before routing, reflecting the source `disabledAgents` filtering behavior in a static Codex skill.
- [x] 3.3 Ensure the final prose is concise enough to be useful as a skill while retaining the source orchestrator's operating judgment.

## 4. Verification

- [x] 4.1 Manually inspect the rewritten skill against `openspec/changes/rewrite-codex-orchestrator-skill/specs/orchestrator-skill-guidance/spec.md`.
- [x] 4.2 Run `bun run test`, `bun run typecheck`, and `bun run lint` unless the Markdown-only change clearly has no applicable runtime impact; if skipped, record the reason.
- [x] 4.3 Run `openspec status --change rewrite-codex-orchestrator-skill` and confirm the change is ready for implementation tracking.

## 5. Strict Fidelity Revision

- [x] 5.1 Tighten the spec and design so the skill must preserve source prompt fidelity, not merely provide generic Codex orchestration advice.
- [x] 5.2 Rewrite the skill to preserve every bundled source specialist's role, delegate triggers, non-delegation triggers, and rule-of-thumb behavior before layering Codex fallbacks.
- [x] 5.3 Preserve validation routing, parallel delegation examples, context isolation, and communication rules as Codex-native behavior while omitting unsupported OpenCode runtime features.
- [x] 5.4 Preserve observer's source-specific behavior from README and hooks, including optional/default-disabled status, vision-capable model requirement, full file paths, raw-media context isolation, and no use for exact plain-text editing.
- [x] 5.5 Remove non-bundled source agents and unsupported runtime behaviors from the spec, design, and skill, including council, session reuse, auto-continue, task-session manager, and invented default advisory routing.

## 6. Strict Verification

- [x] 6.1 Perform a source coverage check against `references/oh-my-opencode-slim/src/agents/orchestrator.ts` and `references/oh-my-opencode-slim/README.md`.
- [x] 6.2 Re-run `bun run test`, `bun run typecheck`, and `bun run lint`.
- [x] 6.3 Re-run `openspec instructions apply --change rewrite-codex-orchestrator-skill --json` and confirm all tasks are complete.

## 7. Plugin Surface Correction

- [x] 7.1 Tighten spec and design language so source fidelity applies only to the six subagents bundled by this plugin.
- [x] 7.2 Remove requirements to preserve non-bundled or unsupported source features, including council, session reuse, auto-continue, task-session manager behavior, and invented default advisory routing.
- [x] 7.3 Remove non-bundled routes and unsupported runtime behavior from `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`.
- [x] 7.4 Confirm the final skill names only bundled custom subagents and concrete Codex fallbacks that fit the current runtime.
