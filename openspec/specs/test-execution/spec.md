# test-execution Specification

## Purpose

Define how repository tests are authored and executed.
## Requirements
### Requirement: Bun test command

The repository SHALL provide a package test command that runs the test suite
with Bun.

#### Scenario: Test command executes through Bun

- **WHEN** a developer runs `bun run test`
- **THEN** the repository test suite runs with Bun's test runner

### Requirement: TypeScript test authoring

Repository tests SHALL be authored as TypeScript test files compatible with the
configured TypeScript project.

#### Scenario: Installer tests are TypeScript

- **WHEN** the installer behavior tests are present in the repository
- **THEN** they use a `.test.ts` TypeScript test file

#### Scenario: TypeScript verification includes tests

- **WHEN** a developer runs `bun run typecheck`
- **THEN** the TypeScript test files are checked without requiring emitted files

### Requirement: Node installer runtime coverage

Installer tests SHALL execute the installer CLI through Node to verify the
supported runtime path.

#### Scenario: Tests invoke installer with Node

- **WHEN** the installer tests run the installer script as a subprocess
- **THEN** the subprocess uses the Node executable with the `.mjs` installer
  entrypoint

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

