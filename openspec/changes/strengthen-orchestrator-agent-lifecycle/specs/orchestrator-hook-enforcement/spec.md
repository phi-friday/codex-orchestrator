## ADDED Requirements

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
