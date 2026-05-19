## ADDED Requirements

### Requirement: Complete Codex-native orchestration skill
The `codex-orchestrator` skill SHALL replace the placeholder guidance with a complete Codex-native orchestration workflow derived from the referenced OpenCode orchestrator behavior.

#### Scenario: Agent invokes the skill for a complex coding task
- **WHEN** an agent reads `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`
- **THEN** the skill explains the orchestrator role, delegation decision flow, subagent routing, execution flow, integration responsibilities, and verification standard without depending on OpenCode-only commands.

#### Scenario: Implementation source is reviewed
- **WHEN** the skill is rewritten
- **THEN** the implementation MUST account for `buildOrchestratorPrompt(disabledAgents)`, validation routing, parallel delegation examples, `createOrchestratorAgent()`, and source README/codemap guidance rather than copying only a single prompt string.

### Requirement: Delegation gate before execution
The skill SHALL require the parent agent to evaluate delegation before acting on substantive work.

#### Scenario: Work has independent subtasks
- **WHEN** a user request includes independent research, implementation, review, visual analysis, or verification lanes
- **THEN** the skill directs the parent to identify the critical path, delegate bounded independent lanes, and continue useful non-overlapping local work while subagents run.

#### Scenario: Delegation overhead exceeds value
- **WHEN** the work is tiny, tightly coupled, immediately blocking, unclear, or cheaper to do locally than explain
- **THEN** the skill directs the parent to keep the work local and state any important assumption briefly.

### Requirement: Specialist routing guidance
The skill SHALL include routing guidance for the bundled Codex subagent templates and their Codex fallbacks.

#### Scenario: Bundled subagents are available
- **WHEN** installed custom subagents such as `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, or `observer` are available
- **THEN** the skill routes codebase reconnaissance, external documentation, strategic review, UI/UX work, bounded implementation, and visual/media analysis to the matching specialist when delegation adds net value.

#### Scenario: Bundled subagents are unavailable
- **WHEN** a matching bundled subagent is not available in the Codex session
- **THEN** the skill provides fallback routing through Codex `explorer`, `worker`, `default`, or local parent work as appropriate, and MUST NOT assume unavailable custom agents can be called.

### Requirement: Observer-specific handling
The skill SHALL treat observer as a special optional read-only visual/media analysis role.

#### Scenario: Visual or media evidence is relevant
- **WHEN** the task requires interpreting images, screenshots, PDFs, diagrams, or other visual files and observer is available
- **THEN** the skill directs the parent to delegate to observer with full file paths and request concise structured observations instead of loading raw media context into the parent.

#### Scenario: Observer is unavailable or not vision-capable
- **WHEN** observer is not installed, disabled, or not configured with suitable visual/PDF capability
- **THEN** the skill directs the parent to use available local vision/PDF tooling or state the limitation, and MUST NOT fabricate visual observations.

### Requirement: Self-contained subagent prompts
The skill SHALL provide a reusable prompt shape for delegated work.

#### Scenario: Parent delegates implementation
- **WHEN** the parent spawns a coding subagent
- **THEN** the prompt includes objective, relevant context, ownership or write scope, constraints, expected output, verification expectations, and coordination instructions that the subagent is not alone in the codebase and must not revert unrelated edits.

#### Scenario: Parent delegates read-only analysis
- **WHEN** the parent spawns a read-only research, review, or observer subagent
- **THEN** the prompt includes the read scope, exact question, desired evidence, and output format, and makes clear that no file edits are expected.

### Requirement: Parent-owned integration and verification
The skill SHALL make completion dependent on parent review, integration, and verification rather than subagent completion alone.

#### Scenario: Subagents return results
- **WHEN** delegated subagents finish
- **THEN** the parent reviews their outputs, integrates compatible changes or findings, resolves conflicts, and runs relevant repository checks before claiming completion.

#### Scenario: Verification is incomplete
- **WHEN** checks are skipped, unavailable, or fail
- **THEN** the parent reports the exact verification gap or failure and does not claim the work is fully complete.
