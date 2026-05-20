## Why

Codex Orchestrator currently says subagents are the default, but its routing
guidance and hooks still leave broad subjective exits that let the parent agent
avoid delegation for substantive work. This weakens the plugin's core value:
saving parent context, improving judgment through specialists, and making
subagent use routine unless the user opts out or an objective local-only
exception applies.

## What Changes

- Strengthen the orchestrator skill so applicable substantive work defaults to
  spawning a suitable available subagent unless a closed-list local-only
  exception applies.
- Replace subjective local-only reasons such as confidence, routine judgment,
  speed preference, convenience, or "I can do it myself" with objective
  exception requirements.
- Make `librarian` the default route when the parent would otherwise use
  Context7, web search, GitHub search, official docs, release notes, migration
  guides, SDK docs, framework docs, cloud docs, AI tooling docs, or library
  internals for substantive work.
- Make `oracle` a normal read-only review and judgment lane for non-trivial
  implementation plans, patches, OpenSpec proposals/designs, debugging
  hypotheses, architecture tradeoffs, and changes to orchestration rules,
  hooks, schemas, installers, or subagent prompts.
- Strengthen hook applicability and stop-time guidance so route-specific
  delegation evidence is expected for documentation/network research and
  oracle-worthy review or judgment work.
- Add or update tests that verify docs/network prompts receive orchestrator
  context, invalid subjective local-only reasons are rejected, and route-specific
  completion evidence is enforced where feasible.

## Capabilities

### New Capabilities

### Modified Capabilities
- `orchestrator-skill-guidance`: strengthen subagent-first routing, closed-list
  local-only exceptions, librarian default routing, and oracle review routing.
- `orchestrator-hook-enforcement`: strengthen prompt applicability and
  completion guards for route-specific delegation evidence and invalid
  local-only reasons.

## Impact

- `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.mjs`
- `plugins/codex-orchestrator/hooks/orchestrator-enforcement.test.ts`
- Potentially `plugins/codex-orchestrator/scripts/subagent-template-quality.test.ts`
  if template quality expectations need to reflect strengthened routing text.
- No new runtime dependencies are expected.
