# orchestrator-hook-enforcement Specification

## Purpose

Define hook-driven behavior that nudges Codex toward orchestrator usage by
default for applicable work while preserving explicit user opt-out requests.
## Requirements
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

#### Scenario: Completion lacks delegation evidence
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion for applicable substantive work without subagent usage evidence or a concrete allowed local-only reason
- **THEN** it MAY request continuation with a concise prompt to apply the subagent-first orchestration standard.

#### Scenario: Completion is not applicable
- **WHEN** a Stop hook receives a final assistant message for a simple answer, explicit opt-out task, or non-coding prompt
- **THEN** it MUST allow the turn to finish.

### Requirement: Subagent lifecycle cleanup completion guard
The Stop hook SHALL guard against completion claims after delegated subagent work
when the final response omits cleanup evidence for no-longer-needed
Codex-managed subagent threads.

#### Scenario: Delegated completion lacks cleanup evidence
- **WHEN** a Stop hook receives a final assistant message that appears to claim completion after mentioning delegated subagent work
- **AND** the message does not mention closing, stopping, releasing, or an explicit lack of supported cleanup control for no-longer-needed subagent threads
- **THEN** it MUST request continuation with a concise prompt to close, stop, or otherwise release completed, failed, obsolete, or no-longer-needed Codex-managed subagent threads when supported before finishing.

#### Scenario: Delegated completion reports cleanup evidence
- **WHEN** a Stop hook receives a final assistant message that claims completion after delegated subagent work
- **AND** the message reports that no-longer-needed Codex-managed subagent threads were closed, stopped, or otherwise released
- **THEN** it MUST allow the turn to finish if the existing delegation and verification evidence requirements are also satisfied.

#### Scenario: Delegated completion reports cleanup limitation
- **WHEN** a Stop hook receives a final assistant message that claims completion after delegated subagent work
- **AND** the message explicitly reports that no supported close, stop, or release mechanism was available
- **THEN** it MUST allow the turn to finish if the existing delegation and verification evidence requirements are also satisfied.

#### Scenario: Completion did not use subagents
- **WHEN** a Stop hook receives a final assistant message that claims completion with a concrete allowed local-only reason and does not mention delegated subagent work
- **THEN** it MUST NOT require subagent cleanup evidence.

#### Scenario: Stop hook already active during cleanup reminder
- **WHEN** a Stop hook receives `stop_hook_active: true`
- **THEN** it MUST allow the turn to finish without requesting another cleanup continuation.

### Requirement: Hook reminders avoid unsupported process claims
Hook-injected context and Stop hook reminders SHALL describe cleanup as closing,
stopping, or releasing Codex-managed subagent threads rather than terminating OS
processes.

#### Scenario: Cleanup reminder is emitted
- **WHEN** the Stop hook requests continuation for missing subagent cleanup evidence
- **THEN** the reminder MUST NOT claim that subagents are separate OS processes or that the plugin can terminate OS processes.

#### Scenario: User prompt context mentions lifecycle cleanup
- **WHEN** hook-injected context includes subagent lifecycle guidance
- **THEN** it MUST use Codex-managed subagent thread terminology and MUST NOT use OS-process termination terminology.
