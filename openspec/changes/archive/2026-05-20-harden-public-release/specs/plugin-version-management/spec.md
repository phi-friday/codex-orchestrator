## ADDED Requirements

### Requirement: Version drift check is part of release readiness
The release readiness workflow SHALL include the generated README version drift
check.

#### Scenario: Release verification runs generated doc check
- **WHEN** a maintainer runs the documented release verification sequence
- **THEN** the sequence MUST include `bun run version:check` in addition to
  tests, typecheck, and lint.

#### Scenario: README release docs list generated doc check
- **WHEN** a maintainer reads the development or release verification
  documentation
- **THEN** it MUST list `bun run version:check` as a required pre-release
  command.
