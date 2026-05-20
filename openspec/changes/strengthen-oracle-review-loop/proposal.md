## Why

Codex Orchestrator currently treats `oracle` as a review gate, but agents can
still satisfy the guidance with a single review pass and stop after subjective
"good enough" reasoning. This change makes final oracle review a quality-gated
closure loop so prompt, skill, orchestration, and other high-judgment work keeps
iterating until actionable findings are resolved or explicitly accounted for.

## What Changes

- Require non-trivial oracle-routed work to use an iterative review closure loop
  during finalization rather than treating one oracle pass as sufficient.
- Require the parent to track oracle findings, resolve accepted findings, and
  explicitly justify rejected, stale, duplicate, contradictory, or out-of-scope
  findings.
- Require follow-up oracle review after meaningful accepted changes until no
  actionable findings remain or all remaining findings are accounted for.
- Define subjective stopping reasons such as cost, time, convenience, perceived
  simplicity, and "oracle was already consulted once" as invalid.
- Keep enforcement in the skill and specs; this change does not add hook-based
  enforcement for the review loop.

## Capabilities

### New Capabilities

### Modified Capabilities

- `orchestrator-skill-guidance`: Add iterative oracle review closure requirements
  and final reporting expectations for oracle-routed work.

## Impact

- Updates `openspec/specs/orchestrator-skill-guidance/spec.md` via a change
  delta.
- Updates `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` to
  encode the review loop in the workflow and completion standard.
- May add or update documentation-oriented tests that guard the required skill
  language.
- Does not change runtime hook behavior or add persistent review-loop state.
