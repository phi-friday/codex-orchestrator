## ADDED Requirements

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
The skill SHALL require the parent agent to evaluate delegation before acting on substantive work.

#### Scenario: Work has independent subtasks
- **WHEN** a user request includes independent research, implementation, review, visual analysis, or verification lanes
- **THEN** the skill directs the parent to identify the critical path, delegate bounded independent lanes, and continue useful non-overlapping local work while subagents run.

#### Scenario: Delegation overhead exceeds value
- **WHEN** the work is tiny, tightly coupled, immediately blocking, unclear, or cheaper to do locally than explain
- **THEN** the skill directs the parent to keep the work local and state any important assumption briefly.

#### Scenario: Delegation is announced
- **WHEN** the parent tells the user it is delegating work
- **THEN** the skill MUST direct the parent to launch the subagent in the same turn rather than merely describing a future delegation.

### Requirement: Specialist routing guidance
The skill SHALL include routing guidance for the bundled Codex subagent templates and their Codex fallbacks.

#### Scenario: Bundled subagents are available
- **WHEN** installed custom subagents such as `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, or `observer` are available
- **THEN** the skill routes codebase reconnaissance, external documentation, strategic review, UI/UX work, bounded implementation, and visual/media analysis to the matching specialist when delegation adds net value.

#### Scenario: Bundled subagents are unavailable
- **WHEN** a matching bundled subagent is not available in the Codex session
- **THEN** the skill provides fallback routing only through concrete Codex roles exposed by the current runtime, such as `explorer` or `worker`, or through local parent work, and MUST NOT invent advisory fallback agents.

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
