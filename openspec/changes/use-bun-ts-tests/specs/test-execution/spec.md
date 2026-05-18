## ADDED Requirements

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
