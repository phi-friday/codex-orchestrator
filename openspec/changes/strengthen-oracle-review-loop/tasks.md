## 1. Skill Guidance

- [ ] 1.1 Update the `codex-orchestrator` skill oracle section to state that non-trivial oracle-routed work uses an iterative quality closure loop, not a single review pass.
- [ ] 1.2 Add closed stopping conditions for the oracle review loop: no actionable findings, or all remaining findings are explicitly accounted for as rejected, deferred, non-actionable, out of scope, duplicate, stale, contradictory, already mitigated, or superseded.
- [ ] 1.3 Add invalid stopping reasons: cost, speed, convenience, perceived simplicity, parent confidence, small diff size, routine judgment, and "oracle was already consulted once."
- [ ] 1.4 Define meaningful accepted changes that require follow-up oracle review, including behavior, requirements, prompt interpretation, workflow, routing criteria, schema behavior, hook behavior, installer behavior, verification strategy, risk handling, and maintainability-sensitive structure.
- [ ] 1.5 Add finding ledger guidance with stable identifiers, status, rationale, and resolution evidence for every oracle finding.
- [ ] 1.6 Update the completion standard to require oracle closure evidence in final reports for non-trivial oracle-routed work.

## 2. Tests and Verification Guards

- [ ] 2.1 Add or update documentation-oriented tests that assert the skill contains iterative oracle closure loop guidance.
- [ ] 2.2 Add or update tests that assert the skill rejects subjective stopping reasons and single-pass oracle completion when actionable findings remain.
- [ ] 2.3 Add or update tests that assert the skill describes finding ledger fields and final oracle closure reporting.
- [ ] 2.4 Add or update tests that assert the iterative oracle loop is skill/finalization guidance and not Stop hook enforcement.

## 3. OpenSpec Validation

- [ ] 3.1 Run `openspec status --change strengthen-oracle-review-loop` and confirm the change is apply-ready.
- [ ] 3.2 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
- [ ] 3.3 Perform an oracle review loop on the implemented change and continue follow-up review until no actionable findings remain or all remaining findings are explicitly accounted for.
