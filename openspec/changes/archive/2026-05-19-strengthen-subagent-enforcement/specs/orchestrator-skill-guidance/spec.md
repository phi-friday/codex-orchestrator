## ADDED Requirements

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
- **THEN** the skill MUST require the parent to state a concrete allowed reason, such as explicit user opt-out, unavailable matching subagent, trivial single-command check, immediately blocking critical-path work, or already-known exact context.

### Requirement: Narrow local-only exceptions
The `codex-orchestrator` skill SHALL treat local-only execution as an exception
for applicable work rather than an equal default path.

#### Scenario: Work is a trivial direct command
- **WHEN** the user requests a single direct command or exact known-file lookup with no independent analysis lane
- **THEN** the skill MAY allow local-only execution and MUST still apply parent-owned verification and reporting.

#### Scenario: Delegation would block immediate progress
- **WHEN** the next parent action is immediately blocked on a small fact that is faster to determine locally than to explain to a subagent
- **THEN** the skill MAY allow the parent to resolve that fact locally, but MUST still delegate any remaining independent substantive lanes.

#### Scenario: Suitable subagent is unavailable
- **WHEN** applicable work would normally be delegated but no suitable specialist or fallback role is available in the current Codex session
- **THEN** the skill MUST allow local execution only with a brief stated availability reason.

## MODIFIED Requirements

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
- **THEN** the parent MUST keep that work local while still applying the orchestrator decision gate and completion standard.
