## 1. Skill Guidance

- [x] 1.1 Update `codex-orchestrator` skill local-only guidance to use a closed list of objective exceptions.
- [x] 1.2 Remove or subordinate subjective local-only exits based on confidence, routine judgment, speed, convenience, perceived simplicity, or "I can do it myself".
- [x] 1.3 Strengthen `librarian` routing so parent intent to use Context7, web, GitHub, official docs, release notes, migration docs, SDK/framework/cloud/AI-tooling docs, or library internals delegates to `librarian` by default.
- [x] 1.4 Strengthen `oracle` routing so non-trivial plans, patches, OpenSpec artifacts, debugging hypotheses, architecture tradeoffs, and orchestration/hook/schema/installer/prompt changes use `oracle` review by default.
- [x] 1.5 Add concise routing-gate language that makes uncertainty a delegation trigger and requires local-only reasons to name an allowed exception.

## 2. Hook Enforcement

- [x] 2.1 Extend UserPromptSubmit applicability patterns to detect documentation, network, official-docs, current-knowledge, SDK/framework/cloud/AI-tooling, release-note, migration, and library-internals prompts.
- [x] 2.2 Extend UserPromptSubmit context with route-specific `librarian` and `oracle` guidance when matching prompt terms are detectable.
- [x] 2.3 Add Stop hook detection for invalid subjective local-only reasons, including confidence, routine nature, speed, convenience, perceived simplicity, "I can do it myself", "API is simple", and "parent already knows enough".
- [x] 2.4 Add Stop hook route-specific evidence checks for detectable documentation/network research that lacks `librarian` evidence or an allowed objective local-only reason.
- [x] 2.5 Add Stop hook route-specific evidence checks for detectable review/judgment work that lacks `oracle` evidence or an allowed objective local-only reason.
- [x] 2.6 Keep Stop hook checks loop-safe and text-deterministic without claiming proof of actual runtime subagent execution.

## 3. Tests

- [x] 3.1 Add hook tests for docs/network/current-knowledge prompts receiving orchestrator context.
- [x] 3.2 Add hook tests for OpenSpec proposal, design, review, debugging, orchestration, hook, schema, installer, skill prompt, and subagent prompt terms receiving oracle-oriented context.
- [x] 3.3 Add Stop hook tests that block subjective local-only completion reasons.
- [x] 3.4 Add Stop hook tests that allow closed-list objective local-only completion reasons with verification evidence.
- [x] 3.5 Add Stop hook tests for route-specific `librarian` and `oracle` completion evidence requirements.
- [x] 3.6 Update skill/template quality tests if strengthened guidance changes expected text coverage.

## 4. Verification

- [x] 4.1 Run `openspec validate strengthen-subagent-default-routing --strict`.
- [x] 4.2 Run `bun run test`.
- [x] 4.3 Run `bun run typecheck`.
- [x] 4.4 Run `bun run lint`.
