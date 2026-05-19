## Context

`plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` is currently a minimal placeholder. The intended behavior lives in the referenced OpenCode implementation, especially `references/oh-my-opencode-slim/src/agents/orchestrator.ts`, where the orchestrator prompt is built from specialist descriptions, validation routing lines, and parallel delegation examples.

The source is not a single static prompt. `buildOrchestratorPrompt(disabledAgents)` filters agent descriptions, validation routing, and parallel delegation examples when agents are disabled. `createOrchestratorAgent()` then resolves replacement or appended custom prompts through `resolvePrompt()`. The Codex skill cannot implement dynamic prompt filtering at runtime, but it must preserve the decision model and explicitly tell agents to route only to subagents that are available in the current Codex session.

Observer also has source-level special handling. The README describes it as an optional read-only visual analysis agent that is disabled by default unless configured with a vision-capable model. The source orchestrator says to delegate visual analysis to observer even when the parent model supports vision, because observer isolates large image/PDF bytes and returns concise observations. The image hook also strips image parts when observer is enabled and inserts a nudge to delegate using saved file paths. The Codex skill should preserve these semantics as guidance, while acknowledging that Codex availability depends on installed custom agents and session tools.

## Goals / Non-Goals

**Goals:**

- Rewrite the skill as complete orchestration guidance rather than incremental edits to the placeholder.
- Preserve the source workflow: understand, choose path by quality/speed/cost/reliability, perform a delegation check, split independent work, execute, validate, and verify.
- Translate OpenCode-specific concepts into Codex equivalents:
  - `@explorer` becomes installed `orchestrator-explorer` when available, or Codex `explorer` fallback.
  - `@fixer`, `@designer`, `@oracle`, `@librarian`, and `@observer` become installed custom subagents when present, or Codex `worker`/`default`/local handling when absent.
  - `subtask` becomes Codex context-isolation guidance via bounded `spawn_agent` work when the parent only needs the summary.
  - `auto_continue` becomes guidance to keep working autonomously through the current turn and maintain a plan, without referencing unavailable OpenCode tooling.
- Include prompt templates that make subagent tasks self-contained and define ownership, outputs, coordination, and verification.
- Make the skill enforce parent-owned integration and verification.
- Make observer routing explicit and conservative: use it for visual/media analysis when available, include full paths, do not ask it to edit, and handle absence without inventing visual findings.

**Non-Goals:**

- Do not add runtime code, new installer behavior, or new subagent templates.
- Do not port OpenCode-only commands, hooks, task session manager behavior, multiplexer behavior, or council mechanics into the skill.
- Do not require a new automated test harness unless existing repository checks naturally cover Markdown and plugin metadata.
- Do not preserve the existing placeholder prose except for metadata that still applies.

## Decisions

1. **Replace the skill wholesale.**

   The current file is a dummy and should not constrain the rewrite. Keeping fragments would create mixed guidance and weaken the delegation check.

   Alternative considered: patch the existing placeholder in place. Rejected because the target behavior is broader and more structured than the placeholder.

2. **Use static availability-aware guidance instead of dynamic disabled-agent filtering.**

   The OpenCode prompt builder removes disabled agents from multiple prompt sections. A Codex skill cannot inspect installed custom agent definitions reliably at skill-render time, so the skill will require the parent agent to check available subagent roles before routing and to use fallback roles when named custom agents are absent.

   Alternative considered: hard-code all bundled subagents as always available. Rejected because users may not have run the installer, may disable agents through configuration, or may be using Codex sessions that expose only built-in `explorer`, `worker`, and `default`.

3. **Keep source agent names as conceptual roles but map them to Codex calls.**

   The skill should name bundled custom agents such as `orchestrator-explorer`, `fixer`, `oracle`, `designer`, `librarian`, and `observer`, because those are the templates installed by this plugin. It should also include fallback guidance:

   - codebase reconnaissance: `explorer`;
   - bounded implementation/test work: `worker`;
   - strategic review, docs research, visual analysis, or synthesis without a matching specialist: `default` or local parent work depending on risk and tool availability.

4. **Keep parent ownership explicit.**

   Subagents can search, implement bounded patches, review, or analyze visual evidence, but completion requires the parent to review outputs, integrate results, handle conflicts, run appropriate checks, and report any unverified areas. This mirrors the source workflow's validation stage and avoids treating delegation as a substitute for engineering ownership.

5. **Preserve observer as a special case.**

   The skill will state that observer is for read-only visual/media analysis and should receive full file paths. It will also explain why observer exists: it keeps raw image/PDF/media context out of the parent and helps when the orchestrator model is not multimodal. If observer is unavailable, the parent must use available local vision/PDF tooling or state the limitation; it must not pretend observer analysis happened.

6. **Remove OpenCode-only tool names from final instructions.**

   The skill should not instruct Codex agents to call `auto_continue`, `subtask`, `read_session`, `@agentName`, or OpenCode multiplexer/session commands. It can explain the equivalent behavior in Codex terms: spawn bounded agents, continue non-overlapping local work, wait only when needed, and close/reuse sessions only if the runtime supports it.

## Risks / Trade-offs

- **Risk: The skill over-delegates simple work.** → Mitigation: include explicit "do it yourself" thresholds when overhead exceeds value, the next action is blocked, the change is tiny, or the task is tightly coupled.
- **Risk: Users without installed custom subagents see unusable role names.** → Mitigation: include a fallback routing table for Codex built-in `explorer`, `worker`, and `default`.
- **Risk: Observer guidance implies unavailable multimodal capability.** → Mitigation: state that observer is optional/configuration-dependent and require the parent to verify availability or use alternate tooling.
- **Risk: OpenCode-only behavior leaks into Codex instructions.** → Mitigation: implementation tasks must review the source function and README, then translate semantics rather than copying tool names.
- **Risk: Markdown-only change lacks automated behavioral verification.** → Mitigation: run repository checks required by AGENTS.md where practical and manually inspect the final skill for required routing, observer, fallback, and completion-standard sections.
