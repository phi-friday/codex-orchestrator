## Context

The current orchestrator skill already describes subagent-first execution, but
it also includes subjective local-only exits such as parent confidence, routine
decisions, speed preference, and simple-looking APIs. Those exits make it easy
for a parent agent to avoid spawning specialists even when independent research,
review, documentation, or verification lanes exist.

The hook layer reinforces the general standard at prompt and stop time, but it
does not yet distinguish route-specific obligations. A final response can
mention generic delegation evidence or a broad local-only reason without showing
that documentation/network research went to `librarian` or that non-trivial
review/judgment went to `oracle`.

## Goals / Non-Goals

**Goals:**
- Make local-only execution a closed-list exception rather than a judgment call.
- Make "when in doubt, delegate" explicit and actionable.
- Route external current knowledge to `librarian` by default.
- Route non-trivial review and judgment to `oracle` by default.
- Add hook coverage and tests for documentation/network prompts,
  route-specific completion evidence, and invalid subjective local-only reasons.
- Preserve parent-owned integration, verification, and concise communication.

**Non-Goals:**
- Do not require subagents for trivial single-command checks, exact known-file
  lookups, explicit user opt-outs, or truly sequential work with no independent
  lane.
- Do not make hooks prove actual runtime subagent execution beyond the evidence
  available in hook input.
- Do not add new dependencies or change the subagent installation mechanism.
- Do not change bundled subagent identities or model configuration semantics.

## Decisions

1. Use a closed-list exception model.

   The skill should state that local-only execution is allowed only for explicit
   opt-out, unavailable matching specialist after availability handling, trivial
   single-command check, exact known-file lookup with no synthesis, or
   immediately blocking critical-path step with no independent lane. Confidence,
   routine nature, convenience, speed, "parent already knows enough", and "I can
   do it myself" are not valid exceptions.

   Alternative considered: require the parent to persuade the user that
   delegation is unnecessary. That captures the burden of proof, but it invites
   verbose rationalization and remains subjective. The closed-list model is more
   testable and harder to game.

2. Treat parent-initiated external research as a `librarian` trigger.

   If the parent would use Context7, web search, GitHub search, official docs,
   release notes, migration guides, SDK/framework/cloud/AI-tooling docs, or
   library internals for substantive work, the skill should route that lane to
   `librarian` when available. Parent-local documentation research remains valid
   only for stable language/runtime basics or source text already present in the
   conversation or repository.

3. Treat `oracle` as a normal review gate for non-trivial judgment.

   The skill should present `oracle` as the default read-only review/judgment
   lane for non-trivial plans, patches, OpenSpec proposals/designs, architecture
   tradeoffs, unclear debugging hypotheses, maintainability or simplification
   review, and changes to the orchestrator skill, hooks, schemas, installers, or
   subagent prompts. Oracle can run late, after a plan or draft patch exists, so
   it does not block initial progress.

4. Strengthen hooks with route-specific evidence checks.

   The UserPromptSubmit hook should recognize documentation, library, SDK,
   framework, cloud, migration, release-note, web, network, and official-docs
   prompts as applicable orchestration work. The Stop hook should reject
   completion messages that rely on invalid subjective local-only reasons, and
   should require route-specific evidence or an allowed objective local-only
   reason when the final response indicates documentation/network research or
   review/judgment work.

5. Keep enforcement pragmatic.

   Hooks can inspect prompts and final messages, not internal tool traces. Tests
   should verify deterministic pattern behavior and completion guard decisions,
   while the skill continues to define the normative workflow for actual
   routing.

## Risks / Trade-offs

- Increased latency and token cost -> keep objective tiny-task exceptions and
  allow oracle review to run after a plan or patch exists.
- Agents may produce boilerplate local-only explanations -> reject subjective
  reasons explicitly and require the reason to match an allowed exception.
- Route-specific stop checks may produce false positives -> scope patterns to
  clear documentation/network/review/judgment terms and allow objective
  local-only reasons.
- Hooks cannot verify actual spawned-agent execution -> require textual
  evidence in final responses and keep parent-owned verification in the skill.
