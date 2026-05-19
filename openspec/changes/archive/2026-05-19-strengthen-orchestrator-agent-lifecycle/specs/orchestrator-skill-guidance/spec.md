## ADDED Requirements

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
