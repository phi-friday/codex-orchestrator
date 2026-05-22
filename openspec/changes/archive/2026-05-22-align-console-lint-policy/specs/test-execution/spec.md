## ADDED Requirements

### Requirement: Console output policy is verified
The repository verification suite SHALL cover the console output lint policy and output-channel migration rules.

#### Scenario: Lint policy protects hook paths
- **WHEN** repository verification runs
- **THEN** it MUST verify that hook code paths enforce `eslint/no-console` as an error

#### Scenario: Lint policy allows ordinary script console usage
- **WHEN** repository verification runs
- **THEN** it MUST verify that non-hook script paths allow severity-specific console methods

#### Scenario: Non-hook stream writes are absent
- **WHEN** repository verification runs
- **THEN** it MUST verify that non-hook project scripts do not use direct stdout or stderr writes for user-facing output, including `process.stdout.write`, `process.stderr.write`, imported `stdout.write` / `stderr.write`, `writeSync(1, ...)`, and `writeSync(2, ...)`

#### Scenario: Generic console log is absent
- **WHEN** repository verification runs
- **THEN** it MUST verify that project code does not use `console.log` for new or migrated output
