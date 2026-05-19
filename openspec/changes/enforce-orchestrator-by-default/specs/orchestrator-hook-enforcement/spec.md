## ADDED Requirements

### Requirement: Plugin hook registration
The plugin SHALL register bundled lifecycle hooks that can inject orchestrator
guidance when Codex plugin hooks are enabled.

#### Scenario: Plugin manifest declares hooks
- **WHEN** `plugins/codex-orchestrator/.codex-plugin/plugin.json` is reviewed
- **THEN** it MUST declare a hooks entry that resolves to the bundled hook configuration.

#### Scenario: Hook configuration is present
- **WHEN** the bundled hook path is resolved
- **THEN** it MUST contain a valid Codex hooks configuration for lifecycle events used by the plugin.

#### Scenario: Plugin hooks are disabled
- **WHEN** Codex plugin hooks are not enabled in the user's environment
- **THEN** the plugin MUST remain usable through the strengthened skill description and MUST NOT require hook execution for manual `$codex-orchestrator` usage.

### Requirement: User prompt orchestration context
The UserPromptSubmit hook SHALL add concise orchestrator context for applicable
work unless the user explicitly opts out.

#### Scenario: Applicable coding prompt
- **WHEN** a UserPromptSubmit hook receives a prompt for implementation, debugging, review, repository investigation, verification, multi-file edits, or multi-step coding work
- **THEN** the hook MUST emit additional developer context instructing Codex to use the `codex-orchestrator` workflow by default.

#### Scenario: Explicit opt-out prompt
- **WHEN** a UserPromptSubmit hook receives a prompt that explicitly asks not to use orchestration, subagents, delegation, spawned agents, or the orchestrator skill
- **THEN** the hook MUST NOT emit orchestrator-enforcement context.

#### Scenario: Non-coding prompt
- **WHEN** a UserPromptSubmit hook receives a prompt that is not repository, coding, review, debugging, research, verification, or multi-step agent work
- **THEN** the hook SHOULD NOT emit orchestrator-enforcement context.

#### Scenario: Hook output shape
- **WHEN** the UserPromptSubmit hook emits context
- **THEN** it MUST emit valid Codex hook JSON using `hookSpecificOutput.hookEventName` set to `UserPromptSubmit` and `additionalContext` containing the orchestrator guidance.

### Requirement: Hook decision logic is testable
The hook implementation SHALL expose deterministic decision logic that can be
tested without running a Codex session.

#### Scenario: Decision helper is imported
- **WHEN** repository tests import the hook decision helper
- **THEN** they MUST be able to evaluate applicability, opt-out detection, and emitted context without reading stdin or writing stdout.

#### Scenario: Hook CLI is exercised
- **WHEN** tests execute the hook CLI with representative UserPromptSubmit JSON
- **THEN** the CLI MUST produce valid expected output for applicable prompts and no output for explicit opt-out prompts.

### Requirement: Optional stop-time continuation guard
If the plugin adds a Stop hook, it SHALL be loop-safe and narrowly scoped to
prevent premature completion of applicable work.

#### Scenario: Stop hook already active
- **WHEN** a Stop hook receives `stop_hook_active: true`
- **THEN** it MUST allow the turn to finish without requesting another continuation.

#### Scenario: Completion lacks verification
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion for applicable work without parent-owned integration or verification evidence
- **THEN** it MAY request continuation with a concise prompt to apply the orchestrator completion standard.

#### Scenario: Completion is not applicable
- **WHEN** a Stop hook receives a final assistant message for a simple answer, explicit opt-out task, or non-coding prompt
- **THEN** it MUST allow the turn to finish.
