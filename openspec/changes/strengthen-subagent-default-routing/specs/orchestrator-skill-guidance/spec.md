## ADDED Requirements

### Requirement: Closed-list local-only exceptions
The `codex-orchestrator` skill SHALL require local-only execution for applicable
substantive work to match a closed list of objective exceptions.

#### Scenario: Parent cannot name an allowed exception
- **WHEN** applicable substantive work could involve repository investigation, implementation, debugging, review, documentation research, verification, visual analysis, planning, design, proposal work, or multi-step agent work
- **AND** the parent cannot name an allowed local-only exception before acting
- **THEN** the skill MUST direct the parent to spawn at least one suitable available subagent.

#### Scenario: Subjective reasons are not valid exceptions
- **WHEN** the parent's only reason for local-only execution is confidence, routine judgment, speed preference, convenience, perceived simplicity, or ability to do the work itself
- **THEN** the skill MUST treat that reason as invalid and require delegation when a suitable subagent is available.

#### Scenario: Objective local-only exceptions are allowed
- **WHEN** the work is an explicit user opt-out, unavailable matching specialist after availability handling, trivial single-command check, exact known-file lookup with no synthesis, or immediately blocking critical-path step with no independent lane
- **THEN** the skill MAY allow local-only execution and MUST require the parent to state the matching exception when reporting completion.

#### Scenario: Uncertainty exists
- **WHEN** the parent is uncertain whether an independent research, review, verification, documentation, visual, or implementation lane exists
- **THEN** the skill MUST direct the parent to delegate rather than use uncertainty as a local-only reason.

### Requirement: Librarian owns substantive external current knowledge
The `codex-orchestrator` skill SHALL route substantive external current
knowledge research to `librarian` by default when `librarian` is available.

#### Scenario: Parent would use external documentation tools
- **WHEN** the parent would otherwise use Context7, web search, GitHub search, official docs, release notes, migration guides, SDK docs, framework docs, cloud docs, AI tooling docs, or library internals for substantive work
- **THEN** the skill MUST direct the parent to delegate that research lane to `librarian` when available.

#### Scenario: Parent claims API confidence
- **WHEN** the work involves frequently changing APIs, SDKs, frameworks, cloud services, AI tooling, auth libraries, migration behavior, release-specific behavior, official examples, or library internals
- **AND** the parent's only reason to avoid `librarian` is that the API seems simple or the parent feels confident
- **THEN** the skill MUST treat that reason as invalid and require `librarian` routing when available.

#### Scenario: Stable knowledge stays local
- **WHEN** the documentation question concerns stable language or runtime basics, or the required source text is already present in the conversation or repository
- **THEN** the skill MAY allow parent-local handling and MUST still delegate any remaining independent substantive lane when one exists.

### Requirement: Oracle is a normal review and judgment gate
The `codex-orchestrator` skill SHALL route non-trivial review and judgment work
to `oracle` by default when `oracle` is available.

#### Scenario: Non-trivial plan or patch needs review
- **WHEN** the work includes a non-trivial implementation plan, multi-file patch, behavior change with tests, OpenSpec proposal or design, public API/schema/CLI behavior change, or maintainability-sensitive refactor
- **THEN** the skill MUST direct the parent to use `oracle` for read-only review or judgment unless an allowed local-only exception applies.

#### Scenario: Orchestrator internals change
- **WHEN** the work changes orchestration rules, hooks, installer behavior, schemas, bundled subagent templates, or skill prompts
- **THEN** the skill MUST treat `oracle` review as expected before claiming completion when `oracle` is available.

#### Scenario: Oracle can run late
- **WHEN** initial implementation or planning can proceed without blocking on review
- **THEN** the skill MAY direct the parent to spawn `oracle` after a plan or draft patch exists while the parent continues non-overlapping integration or verification work.

#### Scenario: Tiny mechanical work
- **WHEN** the work is limited to typo fixes, formatting-only edits, one-line configuration tweaks, or exact user-specified mechanical changes with no judgment lane
- **THEN** the skill MAY allow the parent to skip `oracle` and MUST still apply the closed-list local-only exception standard for any other subagent lane.
