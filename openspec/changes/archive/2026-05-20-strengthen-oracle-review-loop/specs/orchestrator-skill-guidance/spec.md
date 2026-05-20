## ADDED Requirements

### Requirement: Iterative oracle review closure
The `codex-orchestrator` skill SHALL treat oracle review for non-trivial
oracle-routed work as an iterative quality closure loop rather than a single
review pass.

#### Scenario: Oracle raises actionable findings
- **WHEN** `oracle` review for non-trivial work reports actionable findings
- **AND** the parent accepts one or more findings and makes meaningful changes in response
- **THEN** the skill MUST require the parent to request follow-up `oracle` review before claiming completion.

#### Scenario: Meaningful accepted changes require follow-up
- **WHEN** accepted oracle findings cause changes to behavior, requirements, prompt interpretation, workflow, routing criteria, schema behavior, hook behavior, installer behavior, verification strategy, risk handling, or maintainability-sensitive structure
- **THEN** the skill MUST treat those changes as meaningful and require another `oracle` review pass when `oracle` is available.

#### Scenario: Typo-only resolution does not require another pass
- **WHEN** the only accepted oracle findings are resolved by typo, formatting, or wording-only edits that do not affect behavior, requirements, prompt interpretation, workflow, routing, schemas, hooks, installers, verification, risk handling, or maintainability
- **THEN** the skill MAY allow the parent to stop without follow-up `oracle` review if every remaining finding is accounted for.

#### Scenario: Oracle reports no actionable findings
- **WHEN** follow-up `oracle` review reports no remaining actionable findings
- **THEN** the skill MAY allow the parent to complete after parent-owned integration and verification.

#### Scenario: Remaining findings are accounted for
- **WHEN** remaining oracle findings are explicitly rejected, deferred, marked non-actionable, out of scope, duplicate, stale, contradictory, already mitigated, or superseded
- **THEN** the skill MAY allow completion only if the parent records a concrete rationale and evidence for each remaining finding and reports the residual risk to the user.

#### Scenario: Subjective stopping reasons are invalid
- **WHEN** the parent wants to stop the oracle review loop because review is costly, slow, inconvenient, already done once, apparently good enough, small in diff size, routine, or within the parent's confidence
- **THEN** the skill MUST treat that reason as invalid and require continued oracle review unless a valid closure condition or allowed local-only exception applies.

### Requirement: Oracle finding ledger
The `codex-orchestrator` skill SHALL require the parent to maintain an oracle
finding ledger for non-trivial oracle-routed work that receives oracle findings.

#### Scenario: Findings are classified
- **WHEN** `oracle` returns findings for non-trivial work
- **THEN** the skill MUST require the parent to track each finding with a stable identifier, status, rationale, and resolution evidence.

#### Scenario: Ledger statuses are constrained
- **WHEN** the parent classifies oracle findings
- **THEN** the skill MUST limit final statuses to accepted and fixed, accepted but pending, rejected with rationale, deferred with risk disclosed, non-actionable, out of scope, duplicate, stale, contradictory, already mitigated with evidence, or superseded.

#### Scenario: Accepted findings are resolved
- **WHEN** the parent accepts an oracle finding
- **THEN** the skill MUST require the parent to resolve it before claiming completion or explicitly mark it accepted but pending with user-visible residual risk.

#### Scenario: Rejected findings require evidence
- **WHEN** the parent rejects, defers, or marks an oracle finding non-actionable
- **THEN** the skill MUST require a concrete rationale and evidence rather than a subjective statement of confidence, convenience, simplicity, or preference.

### Requirement: Oracle closure reporting
The `codex-orchestrator` skill SHALL require final completion reports for
non-trivial oracle-routed work to include oracle closure evidence.

#### Scenario: Parent completes after oracle loop
- **WHEN** the parent claims completion after using the iterative oracle review loop
- **THEN** the skill MUST require the final report to include the number of oracle review passes, accepted findings and their resolutions, every remaining finding status with rationale, evidence, and user-visible residual risk, the final oracle result, and parent-owned verification.

#### Scenario: Oracle is unavailable
- **WHEN** oracle-routed work cannot use `oracle` because no suitable oracle specialist or fallback is available in the current Codex session
- **THEN** the skill MUST require a closed-list local-only exception with an availability reason and MUST NOT allow cost, speed, confidence, convenience, perceived simplicity, or parent preference as substitutes for oracle closure.

#### Scenario: Hook enforcement remains out of scope
- **WHEN** the skill describes the iterative oracle review loop
- **THEN** it MUST present the loop as parent finalization guidance and MUST NOT require Stop hook enforcement, persistent hook state, or hook-owned review iteration tracking.
