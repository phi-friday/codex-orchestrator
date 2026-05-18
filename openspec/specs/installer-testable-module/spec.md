# installer-testable-module Specification

## Purpose

Define how the installer script can be imported as a module for focused tests
while preserving direct Node CLI execution.

## Requirements

### Requirement: Importable installer utilities

The installer module SHALL export focused utility functions for option parsing,
configuration discovery and merging, target resolution, template loading, and
template rendering so those behaviors can be tested without spawning the full
CLI process.

#### Scenario: Tests import utilities

- **WHEN** the installer test suite imports the installer module
- **THEN** the utility functions needed for focused installer tests are
  available as named exports

### Requirement: Import has no CLI side effects

Importing the installer module SHALL NOT execute the CLI main flow, parse
process arguments, read configuration sources, write installer output, or set
the process exit code.

#### Scenario: Module import does not run main

- **WHEN** a test imports the installer module
- **THEN** the import completes without invoking installer CLI behavior

### Requirement: Direct Node execution remains supported

The installer module SHALL execute the existing CLI main flow when invoked
directly through Node with the `.mjs` script path.

#### Scenario: Node subprocess invokes installer CLI

- **WHEN** a developer or test runs the installer script with Node
- **THEN** the installer parses CLI arguments and performs the same documented
  behavior as before this change

### Requirement: Node 20 compatible module paths

The installer module SHALL derive its own file and directory paths using ES
module APIs available across Node 20.

#### Scenario: Module resolves bundled assets

- **WHEN** the installer determines its default bundled subagent asset directory
- **THEN** the path is derived from `fileURLToPath(import.meta.url)` or an
  equivalent Node 20-compatible ES module path pattern
