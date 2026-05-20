## ADDED Requirements

### Requirement: Hook commands tolerate plugin paths with spaces
The plugin SHALL register hook commands in a form that keeps the bundled hook
script path intact when the plugin root path contains spaces.

#### Scenario: Hook command references plugin root safely
- **WHEN** the bundled hook configuration is inspected
- **THEN** each command that invokes a script under `${PLUGIN_ROOT}` MUST quote
  or otherwise safely delimit the `${PLUGIN_ROOT}` path segment.

#### Scenario: UserPromptSubmit hook path contains spaces
- **WHEN** Codex executes the UserPromptSubmit hook from a plugin root path that
  contains spaces
- **THEN** the command MUST invoke the bundled `orchestrator-hook.mjs` script
  rather than splitting the path into multiple arguments.

#### Scenario: Stop hook path contains spaces
- **WHEN** Codex executes the Stop hook from a plugin root path that contains
  spaces
- **THEN** the command MUST invoke the bundled `orchestrator-hook.mjs` script
  rather than splitting the path into multiple arguments.

### Requirement: Hook documentation states enforcement limits
Public documentation SHALL describe orchestrator hooks as prompt and completion
nudges based on hook inputs, not as proof that delegation, cleanup, tests, or
verification actually ran.

#### Scenario: README describes Stop hook behavior
- **WHEN** a user reads the README hook notes
- **THEN** the documentation MUST state that the Stop hook checks assistant
  response text for required evidence and does not independently verify command
  execution, subagent lifecycle, or test results.
