# orchestrator-skill-guidance Specification

## Purpose

Define the expected guidance for the bundled `codex-orchestrator` skill,
including Codex-native orchestration workflow, source-faithful specialist
routing, safe delegation prompts, and parent-owned integration and
verification.
## Requirements
### Requirement: Subagent-first execution bias
The `codex-orchestrator` skill SHALL require available subagents to be used by
default for substantive coding-agent work unless an allowed local-only exception
applies.

#### Scenario: Repository investigation has an available specialist
- **WHEN** a user requests repository investigation, codebase analysis, broad file discovery, review, planning-heavy exploration, or multi-file summarization
- **THEN** the skill MUST direct the parent to spawn at least one bounded read-only specialist such as `orchestrator-explorer` or `explorer` before completing the work, unless the user explicitly opted out or no suitable specialist is available.

#### Scenario: Substantive work has independent lanes
- **WHEN** a user request includes independent research, implementation, review, visual analysis, or verification lanes
- **THEN** the skill MUST direct the parent to delegate at least one independent bounded lane to a suitable available subagent and continue non-overlapping parent work while it runs.

#### Scenario: Parent chooses local-only execution
- **WHEN** the parent completes applicable substantive work without spawning a subagent
- **THEN** the skill MUST require the parent to state a concrete allowed reason, such as explicit user opt-out, unavailable matching subagent, trivial single-command check, exact known-file lookup with no synthesis, or immediately blocking critical-path work with no independent lane.

### Requirement: Narrow local-only exceptions
The `codex-orchestrator` skill SHALL treat local-only execution as an exception
for applicable work rather than an equal default path.

#### Scenario: Work is a trivial direct command
- **WHEN** the user requests a single direct command or exact known-file lookup with no independent analysis lane
- **THEN** the skill MAY allow local-only execution and MUST still apply parent-owned verification and reporting.

#### Scenario: Delegation would block immediate progress
- **WHEN** the next parent action is an immediately blocking critical-path step with no independent lane
- **THEN** the skill MAY allow the parent to resolve that fact locally, but MUST still delegate any remaining independent substantive lanes.

#### Scenario: Suitable subagent is unavailable
- **WHEN** applicable work would normally be delegated but no suitable specialist or fallback role is available in the current Codex session
- **THEN** the skill MUST allow local execution only with a brief stated availability reason.

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

### Requirement: Complete Codex-native orchestration skill
The `codex-orchestrator` skill SHALL replace the placeholder guidance with a complete Codex-native orchestration workflow derived from the referenced OpenCode orchestrator behavior.

#### Scenario: Agent invokes the skill for a complex coding task
- **WHEN** an agent reads `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`
- **THEN** the skill explains the orchestrator role, delegation decision flow, subagent routing, execution flow, integration responsibilities, and verification standard without depending on OpenCode-only commands.

#### Scenario: Implementation source is reviewed
- **WHEN** the skill is rewritten
- **THEN** the implementation MUST account for `buildOrchestratorPrompt(disabledAgents)`, validation routing, parallel delegation examples, `createOrchestratorAgent()`, and source README/codemap guidance rather than copying only a single prompt string.

#### Scenario: Source fidelity is evaluated
- **WHEN** the final skill is reviewed against `references/oh-my-opencode-slim/src/agents/orchestrator.ts`
- **THEN** the skill MUST preserve the source prompt's role, workflow phases, delegation efficiency rules, parallelization examples, context-isolation guidance, validation routing, communication rules, and completion standard as Codex-native behavior only for capabilities that this plugin actually exposes.

#### Scenario: Nonexistent source features are excluded
- **WHEN** the source prompt includes agents or runtime features not bundled by this plugin
- **THEN** the skill MUST NOT present those agents or features as available routes, optional routes, or expected behavior.

### Requirement: Source-faithful specialist decision tables
The skill SHALL preserve the original specialist routing judgment at the level of delegate triggers, non-delegation triggers, and rules of thumb.

#### Scenario: Explorer guidance is reviewed
- **WHEN** the skill describes codebase reconnaissance
- **THEN** it MUST include explorer's role as parallel codebase search, delegate triggers for broad or uncertain discovery, non-delegation triggers for known paths, full-file reads, single lookups, and imminent edits, and the Codex mapping to `orchestrator-explorer` or `explorer`.

#### Scenario: Librarian guidance is reviewed
- **WHEN** the skill describes documentation and external research
- **THEN** it MUST distinguish library/API research from general programming knowledge, require official/current/version-specific sources when relevant, list frequent API changes and advanced edge cases as delegation triggers, and map to `librarian` or a documented fallback.

#### Scenario: Oracle guidance is reviewed
- **WHEN** the skill describes strategic analysis
- **THEN** it MUST include high-stakes architecture, persistent problems after multiple attempts, complex debugging, security/scalability/data-integrity tradeoffs, code review, maintainability review, simplification, and YAGNI scrutiny as oracle triggers while excluding routine or first-pass tactical work.

#### Scenario: Designer guidance is reviewed
- **WHEN** the skill describes UI/UX work
- **THEN** it MUST include user-facing polish, responsive layout, UX-critical components, visual consistency, interactions, landing/marketing pages, and UI review as designer triggers while excluding backend/headless work and disposable prototypes.

#### Scenario: Fixer guidance is reviewed
- **WHEN** the skill describes bounded implementation
- **THEN** it MUST require parent triage before delegation, include non-trivial or multi-file implementation, tests, fixtures, mocks, and disjoint parallel edit slices as fixer triggers, and exclude research, architecture, unclear requirements, tiny single-file edits, tight integration, and sequential dependencies.

### Requirement: Delegation gate before execution
The skill SHALL require the parent agent to evaluate delegation before acting on substantive work and SHALL bias the result toward spawning available subagents.

#### Scenario: Work has independent subtasks
- **WHEN** a user request includes independent research, implementation, review, visual analysis, or verification lanes
- **THEN** the skill directs the parent to identify the critical path, delegate bounded independent lanes, and continue useful non-overlapping local work while subagents run.

#### Scenario: Delegation overhead exceeds value
- **WHEN** the work is a trivial single command, tightly coupled immediate critical-path action, unclear request requiring user input, exact known-file lookup, or cheaper local fact lookup with no remaining independent lane
- **THEN** the skill directs the parent to keep only that narrow work local, state any important assumption briefly, and delegate any remaining substantive independent lane when a suitable subagent is available.

#### Scenario: Delegation is announced
- **WHEN** the parent tells the user it is delegating work
- **THEN** the skill MUST direct the parent to launch the subagent in the same turn rather than merely describing a future delegation.

### Requirement: Specialist routing guidance
The skill SHALL include routing guidance for the bundled Codex subagent templates and their Codex fallbacks, and SHALL treat matching available specialists as the expected path for applicable work.

#### Scenario: Bundled subagents are available
- **WHEN** installed custom subagents such as `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, or `observer` are available
- **THEN** the skill routes codebase reconnaissance, external documentation, strategic review, UI/UX work, bounded implementation, and visual/media analysis to the matching specialist by default unless an allowed local-only exception applies.

#### Scenario: Bundled subagents are unavailable
- **WHEN** a matching bundled subagent is not available in the Codex session
- **THEN** the skill provides fallback routing only through concrete Codex roles exposed by the current runtime, such as `explorer` or `worker`, or through local parent work with an explicit availability reason, and MUST NOT invent advisory fallback agents.

#### Scenario: Disabled-agent behavior is translated
- **WHEN** the skill describes availability
- **THEN** it MUST translate the source `disabledAgents` filtering behavior into static Codex guidance that every routing, validation, and parallelization decision is conditional on actual available subagents.

### Requirement: Observer-specific handling
The skill SHALL treat observer as a special optional read-only visual/media analysis role.

#### Scenario: Visual or media evidence is relevant
- **WHEN** the task requires interpreting images, screenshots, PDFs, diagrams, or other visual files and observer is available
- **THEN** the skill directs the parent to delegate to observer with full file paths and request concise structured observations instead of loading raw media context into the parent.

#### Scenario: Observer is unavailable or not vision-capable
- **WHEN** observer is not installed, disabled, or not configured with suitable visual/PDF capability
- **THEN** the skill directs the parent to use available local vision/PDF tooling or state the limitation, and MUST NOT fabricate visual observations.

#### Scenario: Observer source behavior is preserved
- **WHEN** the skill describes observer
- **THEN** it MUST preserve that observer is disabled by default in the source repository, requires a vision-capable model to be useful, isolates raw image/PDF bytes from the parent context, receives full file paths, and should not be used for plain text files that the parent needs to edit exactly.

### Requirement: Self-contained subagent prompts
The skill SHALL provide a reusable prompt shape for delegated work.

#### Scenario: Parent delegates implementation
- **WHEN** the parent spawns a coding subagent
- **THEN** the prompt includes objective, relevant context, ownership or write scope, constraints, expected output, verification expectations, and coordination instructions that the subagent is not alone in the codebase and must not revert unrelated edits.

#### Scenario: Parent delegates read-only analysis
- **WHEN** the parent spawns a read-only research, review, or observer subagent
- **THEN** the prompt includes the read scope, exact question, desired evidence, and output format, and makes clear that no file edits are expected.

### Requirement: Codex translation of OpenCode-only mechanisms
The skill SHALL translate only OpenCode-specific mechanisms whose operational intent maps cleanly to Codex and SHALL omit source runtime features that this plugin does not provide.

#### Scenario: Context isolation is translated
- **WHEN** the source prompt's `subtask` guidance is adapted
- **THEN** the skill MUST direct the parent to use bounded spawned agents or local isolated investigation when the parent only needs a compact result, while preferring named specialists for work that matches a specialist role.

#### Scenario: Unsupported runtime features are omitted
- **WHEN** the source prompt references OpenCode-only runtime behavior such as session reuse, auto-continue tools, task-session managers, multiplexer behavior, `read_session`, or council machinery
- **THEN** the skill MUST omit those behaviors instead of preserving them as Codex guidance.

#### Scenario: Communication rules are translated
- **WHEN** the skill describes parent communication
- **THEN** it MUST include concise execution, brief delegation notices, no flattery, targeted clarification, reasonable minor assumptions, and honest pushback.

### Requirement: Source coverage verification
The implementation SHALL include explicit manual verification that the rewritten skill covers the source prompt's important sections.

#### Scenario: Manual source coverage is performed
- **WHEN** implementation finishes
- **THEN** the implementer MUST compare the final skill against the source agent descriptions, workflow, validation routing, parallel delegation examples, observer README guidance, and Codex fallback constraints before marking tasks complete.

### Requirement: Parent-owned integration and verification
The skill SHALL make completion dependent on parent review, integration, and verification rather than subagent completion alone.

#### Scenario: Subagents return results
- **WHEN** delegated subagents finish
- **THEN** the parent reviews their outputs, integrates compatible changes or findings, resolves conflicts, and runs relevant repository checks before claiming completion.

#### Scenario: Verification is incomplete
- **WHEN** checks are skipped, unavailable, or fail
- **THEN** the parent reports the exact verification gap or failure and does not claim the work is fully complete.

### Requirement: Default orchestrator invocation
The `codex-orchestrator` skill SHALL describe itself as mandatory-by-default for
substantive coding-agent work unless the user explicitly opts out of
orchestration, subagents, delegation, spawned agents, or the orchestrator skill,
and SHALL make subagent spawning the expected execution path for applicable
work.

#### Scenario: Skill description is reviewed
- **WHEN** `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` is reviewed
- **THEN** its frontmatter description MUST state that the skill is used by default for implementation, debugging, code review, repository research, verification, multi-step tasks, multi-file edits, and work with independent subtasks.

#### Scenario: User explicitly opts out
- **WHEN** the user asks Codex not to use orchestration, subagents, delegation, spawned agents, or the orchestrator skill
- **THEN** the skill MUST direct the parent to honor that opt-out and proceed locally when possible.

#### Scenario: User does not mention orchestration
- **WHEN** the user requests substantive coding-agent work without mentioning orchestration
- **THEN** the skill MUST direct the parent to apply the orchestrator workflow before acting and to spawn suitable available subagents unless an allowed local-only exception applies.

#### Scenario: Work is too small for delegation
- **WHEN** the orchestrator workflow determines that work is a trivial single command, exact known-file lookup, or immediately blocking critical-path step with no independent lane
- **THEN** the parent MUST keep the work local while still applying the orchestrator decision gate and completion standard.

### Requirement: Session-scoped bundled subagent availability check
The `codex-orchestrator` skill SHALL require the parent to check bundled
subagent availability once per Codex session before its first orchestration
routing decision, remember the observed availability for that session, and use
that observed result for later routing decisions.

#### Scenario: Bundled subagents are missing at first orchestration use
- **WHEN** the first session-scoped availability check finds one or more expected bundled subagents unavailable
- **THEN** the skill MUST direct the parent to use or recommend the `install-subagents` skill once, report the resulting availability or limitation, and continue with available specialists or fallbacks.
- **AND** the skill MUST NOT direct the parent to repeatedly trigger bundled subagent installation later in the same Codex session unless the user explicitly asks to install or refresh subagents.

#### Scenario: Availability has already been checked
- **WHEN** later work in the same Codex session needs orchestration
- **THEN** the skill MUST direct the parent to route based on the remembered availability result instead of repeating bundled subagent installation checks.

#### Scenario: User explicitly asks to refresh subagents
- **WHEN** the user explicitly asks to install, reinstall, refresh, or repair bundled subagents
- **THEN** the skill MAY direct the parent to use the `install-subagents` skill again even if the session-scoped availability check already ran.

### Requirement: Parent-owned subagent lifecycle cleanup
The `codex-orchestrator` skill SHALL require the parent to close, stop, or
otherwise release completed, failed, obsolete, or no-longer-needed Codex-managed
subagent threads when the current runtime exposes a supported lifecycle control.

#### Scenario: Delegated work is integrated
- **WHEN** delegated subagent work has completed and the parent has integrated or rejected the result
- **THEN** the skill MUST direct the parent to close, stop, or otherwise release that no-longer-needed Codex-managed subagent thread before claiming completion when the runtime supports such a control.

#### Scenario: Delegated work becomes obsolete or fails
- **WHEN** a delegated subagent becomes obsolete, fails, is abandoned, or is no longer needed for the parent-owned path
- **THEN** the skill MUST direct the parent to close, stop, or otherwise release that Codex-managed subagent thread when the runtime supports such a control.

#### Scenario: Runtime does not expose cleanup control
- **WHEN** the parent cannot close, stop, or release a no-longer-needed Codex-managed subagent thread because no supported runtime control is available
- **THEN** the skill MUST direct the parent to report that limitation without claiming an OS process was terminated.

#### Scenario: Completion standard is reviewed
- **WHEN** the skill describes parent-owned completion
- **THEN** it MUST include subagent lifecycle cleanup evidence alongside integration and verification evidence for delegated work.
