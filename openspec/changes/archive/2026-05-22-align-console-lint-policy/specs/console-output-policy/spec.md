## ADDED Requirements

### Requirement: Console usage defaults to allowed
The repository lint configuration SHALL allow console usage by default for non-hook project code.

#### Scenario: Ordinary scripts may use console methods
- **WHEN** lint runs against repository scripts outside hook paths
- **THEN** console method usage is not reported by `eslint/no-console`

### Requirement: Hook code forbids console methods
The repository lint configuration SHALL report console method usage as an error for Codex hook code paths.

#### Scenario: Hook lint rejects console output
- **WHEN** lint runs against files under the Codex Orchestrator hook path
- **THEN** `eslint/no-console` is enforced as an error

### Requirement: Hook protocol output uses streams
Codex hook entrypoints SHALL use direct stream writes for machine-readable hook protocol output.

#### Scenario: Hook emits JSON response
- **WHEN** a hook entrypoint emits a response for Codex to parse
- **THEN** the response is written directly to stdout as serialized JSON followed by a newline

#### Scenario: Hook emits fatal diagnostic
- **WHEN** a hook entrypoint reports a fatal diagnostic before exiting
- **THEN** the diagnostic is written directly to stderr

### Requirement: CLI output uses severity-specific console methods
Non-hook CLI scripts SHALL use severity-specific console methods for user-facing output instead of direct stdout or stderr writes through streams or file descriptors, including `process.stdout.write`, `process.stderr.write`, imported `stdout.write` / `stderr.write` calls, and fd-based writes such as `writeSync(1, ...)` or `writeSync(2, ...)`.

#### Scenario: CLI emits normal status
- **WHEN** a non-hook CLI script emits normal status or usage output
- **THEN** it uses `console.info`
- **AND** it does not write directly to stdout through a stream or file descriptor

#### Scenario: CLI emits an error
- **WHEN** a non-hook CLI script emits an error message
- **THEN** it uses `console.error`
- **AND** it does not write directly to stderr through a stream or file descriptor

#### Scenario: CLI emits warning or diagnostic output
- **WHEN** a non-hook CLI script emits warning or diagnostic output
- **THEN** it uses `console.warn` or `console.debug`

### Requirement: Generic console log is not used
Project code SHALL NOT use `console.log` for new or migrated output.

#### Scenario: Output call sites express severity
- **WHEN** user-facing output is added or migrated
- **THEN** the call site uses a severity-specific console method instead of `console.log`
