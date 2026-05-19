## ADDED Requirements

### Requirement: Subagent-first hook context
The UserPromptSubmit hook SHALL inject context that frames subagent usage as the
expected path for applicable substantive work.

#### Scenario: Applicable repository prompt receives strengthened context
- **WHEN** a UserPromptSubmit hook receives a prompt for implementation, debugging, review, repository investigation, planning, design, proposal work, verification, multi-file edits, or multi-step coding work
- **THEN** the emitted additional context MUST instruct Codex to spawn suitable available subagents by default unless the user explicitly opted out or an allowed local-only exception applies.

#### Scenario: Local-only exception is required
- **WHEN** the emitted additional context describes local-only execution
- **THEN** it MUST limit local-only execution to explicit opt-out, unavailable matching subagents, trivial single-command checks, exact known-file lookups, or immediately blocking critical-path work with no independent lane.

### Requirement: Delegation evidence completion guard
The Stop hook SHALL guard against completion claims for applicable work that
omit both subagent usage and an allowed local-only reason.

#### Scenario: Completion lacks delegation evidence
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion for applicable substantive work without mentioning delegated subagents, parent-owned integration, or an allowed local-only reason
- **THEN** it MUST request continuation with a concise prompt to apply the subagent-first orchestration standard.

#### Scenario: Completion states allowed local-only reason
- **WHEN** a Stop hook receives a final assistant message that claims completion and states a concrete allowed local-only reason with verification evidence
- **THEN** it MUST allow the turn to finish.

#### Scenario: Completion states delegation and verification
- **WHEN** a Stop hook receives a final assistant message that claims completion and reports delegated subagent results plus parent-owned verification
- **THEN** it MUST allow the turn to finish.

## MODIFIED Requirements

### Requirement: User prompt orchestration context
The UserPromptSubmit hook SHALL add concise subagent-first orchestrator context
for applicable work unless the user explicitly opts out.

#### Scenario: Applicable coding prompt
- **WHEN** a UserPromptSubmit hook receives a prompt for implementation, debugging, review, repository investigation, planning, design, proposal work, verification, multi-file edits, or multi-step coding work
- **THEN** the hook MUST emit additional developer context instructing Codex to use the `codex-orchestrator` workflow and spawn suitable available subagents by default.

#### Scenario: Explicit opt-out prompt
- **WHEN** a UserPromptSubmit hook receives a prompt that explicitly asks not to use orchestration, subagents, delegation, spawned agents, or the orchestrator skill
- **THEN** the hook MUST NOT emit orchestrator-enforcement context.

#### Scenario: Non-coding prompt
- **WHEN** a UserPromptSubmit hook receives a prompt that is not repository, coding, review, debugging, research, planning, design, proposal, verification, or multi-step agent work
- **THEN** the hook SHOULD NOT emit orchestrator-enforcement context.

#### Scenario: Hook output shape
- **WHEN** the UserPromptSubmit hook emits context
- **THEN** it MUST emit valid Codex hook JSON using `hookSpecificOutput.hookEventName` set to `UserPromptSubmit` and `additionalContext` containing the subagent-first orchestrator guidance.

### Requirement: Optional stop-time continuation guard
If the plugin adds a Stop hook, it SHALL be loop-safe and narrowly scoped to
prevent premature completion of applicable work.

#### Scenario: Stop hook already active
- **WHEN** a Stop hook receives `stop_hook_active: true`
- **THEN** it MUST allow the turn to finish without requesting another continuation.

#### Scenario: Completion lacks verification
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion for applicable work without parent-owned integration or verification evidence
- **THEN** it MAY request continuation with a concise prompt to apply the orchestrator completion standard.

#### Scenario: Completion lacks delegation evidence
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion for applicable substantive work without subagent usage evidence or a concrete allowed local-only reason
- **THEN** it MAY request continuation with a concise prompt to apply the subagent-first orchestration standard.

#### Scenario: Completion is not applicable
- **WHEN** a Stop hook receives a final assistant message for a simple answer, explicit opt-out task, or non-coding prompt
- **THEN** it MUST allow the turn to finish.
