## ADDED Requirements

### Requirement: Release hardening has regression coverage
The repository test suite SHALL cover public-release hardening behavior for
installer safety, hook path safety, permissions, metadata, and generated docs.

#### Scenario: Installer TOML escaping is tested
- **WHEN** the test suite runs
- **THEN** it MUST verify that configured model strings containing quotes,
  backslashes, newlines, and control characters cannot inject additional TOML
  structure.

#### Scenario: Installer provenance checks are tested
- **WHEN** the test suite runs
- **THEN** it MUST verify that unmanaged target agent files are not overwritten
  or removed by the installer.

#### Scenario: Hook command quoting is tested
- **WHEN** the test suite runs
- **THEN** it MUST verify that bundled hook commands safely delimit
  `${PLUGIN_ROOT}` script paths.

#### Scenario: Librarian sandbox is tested
- **WHEN** the test suite runs
- **THEN** it MUST verify that the bundled `librarian` template defaults to a
  read-only filesystem sandbox.

#### Scenario: Public metadata is tested
- **WHEN** the test suite runs
- **THEN** it MUST verify that root package metadata does not point runtime
  entry fields at non-existent files.

#### Scenario: Release check includes generated docs
- **WHEN** release verification is documented or automated
- **THEN** it MUST include a test or check that `bun run version:check` passes.
