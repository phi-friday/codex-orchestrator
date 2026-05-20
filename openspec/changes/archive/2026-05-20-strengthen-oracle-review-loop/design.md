## Context

The current orchestrator guidance makes `oracle` the expected route for
non-trivial review and judgment work, especially changes to prompts, skills,
hooks, schemas, installers, and orchestration policy. In practice, that guidance
can still be satisfied by a single oracle pass even when oracle reports
actionable issues and the parent makes meaningful changes afterward.

The desired behavior is not hook enforcement. The skill should instead define a
non-optional finalization routine: oracle findings are advisory, but every
finding must be accounted for, and meaningful accepted changes require follow-up
oracle review until quality converges.

## Goals / Non-Goals

**Goals:**

- Make a single oracle pass insufficient when actionable findings remain or the
  parent materially changes the artifact in response.
- Make finalization quality-gated rather than cost-gated.
- Reduce subjective bypasses such as stopping because the parent feels confident,
  the work seems small, or another review would take time.
- Keep the parent responsible for decisions, integration, verification, and
  final reporting.
- Provide concrete skill language and testable spec scenarios for the iterative
  oracle closure loop.

**Non-Goals:**

- Do not add hook enforcement for the review loop.
- Do not make oracle an absolute authority; the parent may reject findings with
  explicit rationale.
- Do not require repeated review when no meaningful accepted changes were made
  and all findings are already resolved, rejected, stale, duplicate,
  contradictory, or out of scope.
- Do not introduce new runtime state, dependencies, or persistent review
  tracking outside the parent turn.

## Decisions

### Use a convergence loop instead of a pass limit

Oracle review should continue until there are no remaining actionable findings
or every remaining finding has been explicitly accounted for. A fixed maximum
pass count would optimize for cost and predictability, but the user explicitly
prioritizes result quality over review cost.

Alternative considered: cap the loop at two review passes. This would limit
churn, but it also gives the parent another easy stopping rationale even when a
third pass would catch issues introduced by the second pass.

### Require a finding ledger

The parent should classify each oracle finding with a stable identifier, status,
rationale, and resolution evidence. Supported statuses should include accepted
and fixed, accepted but pending, rejected with rationale, deferred with risk
disclosed, non-actionable, out of scope, stale, duplicate, contradictory,
already mitigated with evidence, and superseded. The ledger can be internal
during the turn, but final reporting must summarize accepted and unresolved
findings so the user can see why the loop stopped.

Alternative considered: rely on prose summaries such as "addressed oracle
feedback." That is too easy to satisfy without actually accounting for each
finding.

### Follow up only after meaningful accepted changes

Follow-up oracle review is required when the parent changes the artifact in
response to accepted findings in a way that could affect correctness,
maintainability, behavior, requirements, prompt interpretation, workflow,
routing criteria, schemas, hooks, installers, verification strategy, or risk
handling. If the parent only rejects findings, marks duplicates, or fixes a
typo-level issue with no substantive effect, the skill may allow finalization
after reporting the rationale.

Alternative considered: always request another oracle pass after any finding.
That is stricter but can create meaningless review churn for no-op resolutions.

### Keep enforcement in skill guidance and tests

The loop should be documented in `codex-orchestrator` skill guidance and guarded
by specs and documentation-oriented tests. The Stop hook should continue to
enforce only route evidence and completion evidence, not multi-pass oracle
state, because hook inputs do not reliably expose the finding ledger or the
review iteration history.

Alternative considered: add Stop hook checks for phrases such as "follow-up
oracle review." This would be brittle and would likely encourage performative
wording rather than actual iterative review.

## Risks / Trade-offs

- Agents may still claim convergence without doing meaningful accounting. →
  Mitigate by requiring final reporting of review pass count, accepted finding
  resolutions, rejected or out-of-scope rationales, and final oracle result.
- Oracle may produce repeated or contradictory findings. → Mitigate by allowing
  the parent to stop when remaining findings are duplicate, stale,
  contradictory, or outside the user's goal, provided the rationale is reported.
- The loop may lengthen high-judgment tasks. → Accept this trade-off because the
  change intentionally prioritizes output quality over cost and speed.
- Markdown-only behavior changes can be under-tested. → Add targeted tests that
  assert the skill contains the non-optional loop, invalid stopping reasons,
  finding ledger expectations, and no hook-enforcement requirement.
