# public-release-readiness Specification

## Purpose
TBD - created by archiving change harden-public-release. Update Purpose after archive.
## Requirements
### Requirement: Public package metadata is internally consistent
Public repository metadata SHALL NOT advertise runtime entrypoints that do not
exist in the repository.

#### Scenario: Package metadata is checked before release
- **WHEN** release verification inspects root `package.json`
- **THEN** runtime entry fields such as `main`, `module`, `exports`, or `bin`
  MUST either point to existing files or be absent.

### Requirement: Release verification has a documented command set
The repository SHALL document the complete local verification command set that
maintainers run before public release.

#### Scenario: Maintainer reads release verification docs
- **WHEN** a maintainer reads the README or repository agent guidance
- **THEN** the documented pre-release command set MUST include `bun run test`,
  `bun run typecheck`, `bun run lint`, and `bun run version:check`.

#### Scenario: External tool requirement is documented
- **WHEN** a documented command depends on a non-Bun external CLI such as `jq`
- **THEN** the documentation MUST either list that dependency or remove the
  dependency from the command implementation.

### Requirement: Marketplace install smoke gate is defined
The repository SHALL define a pre-release smoke gate for the public marketplace
installation path.

#### Scenario: Marketplace smoke gate is documented
- **WHEN** a maintainer prepares a public release tag
- **THEN** release documentation MUST require a fresh install check using the
  documented Git marketplace source and pinned ref.

#### Scenario: Marketplace smoke gate validates plugin assets
- **WHEN** the marketplace smoke gate is run
- **THEN** it MUST confirm that the plugin catalog resolves the
  `codex-orchestrator` plugin, skills resolve, hooks resolve, and the bundled
  installer can run in dry-run mode with a test configuration.

### Requirement: Public documentation matches hook guarantees
Public documentation SHALL describe plugin hooks according to what they can
actually observe and enforce.

#### Scenario: Stop hook guarantee is described
- **WHEN** a user reads public hook documentation
- **THEN** it MUST describe Stop hook checks as text-based completion nudges and
  MUST NOT imply independent proof that subagents were closed or verification
  commands were executed.

