## ADDED Requirements

### Requirement: Default orchestrator invocation
The `codex-orchestrator` skill SHALL describe itself as mandatory-by-default for
substantive coding-agent work unless the user explicitly opts out of
orchestration, subagents, delegation, or the orchestrator skill.

#### Scenario: Skill description is reviewed
- **WHEN** `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` is reviewed
- **THEN** its frontmatter description MUST state that the skill is used by default for implementation, debugging, code review, repository research, verification, multi-step tasks, multi-file edits, and work with independent subtasks.

#### Scenario: User explicitly opts out
- **WHEN** the user asks Codex not to use orchestration, subagents, delegation, spawned agents, or the orchestrator skill
- **THEN** the skill MUST direct the parent to honor that opt-out and proceed locally when possible.

#### Scenario: User does not mention orchestration
- **WHEN** the user requests substantive coding-agent work without mentioning orchestration
- **THEN** the skill MUST direct the parent to apply the orchestrator workflow before acting.

#### Scenario: Work is too small for delegation
- **WHEN** the orchestrator workflow determines that delegation overhead exceeds value
- **THEN** the parent MUST keep the work local while still applying the orchestrator decision gate and completion standard.
