## ADDED Requirements

### Requirement: Plugin metadata is the version source
The system SHALL treat
`plugins/codex-orchestrator/.codex-plugin/plugin.json` `version` as the single
source of truth for the plugin version.

#### Scenario: Reading current plugin version
- **WHEN** the version management command needs the current plugin version
- **THEN** it MUST read `version` from
  `plugins/codex-orchestrator/.codex-plugin/plugin.json`

#### Scenario: Package metadata remains non-authoritative
- **WHEN** the version management command updates or checks the plugin version
- **THEN** it MUST NOT require, add, or update a top-level `version` field in
  `package.json`

### Requirement: Version command bumps plugin version and renders docs
The system SHALL provide a `version` package script that updates the plugin
version and regenerates generated README files.

#### Scenario: Bumping by patch increment
- **WHEN** a user runs `bun run version patch` and the current version is
  `1.2.3`
- **THEN** the command MUST update `plugin.json` to `1.2.4` and regenerate
  `README.md` and `README.kr.md`

#### Scenario: Bumping by minor increment
- **WHEN** a user runs `bun run version minor` and the current version is
  `1.2.3`
- **THEN** the command MUST update `plugin.json` to `1.3.0` and regenerate
  `README.md` and `README.kr.md`

#### Scenario: Bumping by major increment
- **WHEN** a user runs `bun run version major` and the current version is
  `1.2.3`
- **THEN** the command MUST update `plugin.json` to `2.0.0` and regenerate
  `README.md` and `README.kr.md`

#### Scenario: Setting an exact version
- **WHEN** a user runs `bun run version 0.2.0`
- **THEN** the command MUST update `plugin.json` to `0.2.0` and regenerate
  `README.md` and `README.kr.md`

#### Scenario: Rejecting unsupported version input
- **WHEN** a user runs `bun run version` with no bump target or with a target
  that is not `major`, `minor`, `patch`, or a stable `MAJOR.MINOR.PATCH` version
- **THEN** the command MUST fail without modifying files

### Requirement: README templates generate pinned install documentation
The system SHALL generate root README files from templates stored under
`docs/templates/`.

#### Scenario: Rendering English README
- **WHEN** README files are regenerated for plugin version `0.1.0`
- **THEN** the command MUST render `README.md` from
  `docs/templates/README.md` by replacing `{{VERSION}}` with `0.1.0`

#### Scenario: Rendering Korean README
- **WHEN** README files are regenerated for plugin version `0.1.0`
- **THEN** the command MUST render `README.kr.md` from
  `docs/templates/README.kr.md` by replacing `{{VERSION}}` with `0.1.0`

#### Scenario: Marketplace install ref uses version tag
- **WHEN** README files are regenerated for plugin version `0.1.0`
- **THEN** the generated marketplace installation examples MUST use
  `--ref v0.1.0` instead of `--ref main`

#### Scenario: Missing template placeholder
- **WHEN** a README template does not contain `{{VERSION}}`
- **THEN** the command MUST fail without modifying generated README files

### Requirement: Version check detects generated documentation drift
The system SHALL provide a `version:check` package script that validates
generated README files without modifying them.

#### Scenario: Generated files match templates and plugin version
- **WHEN** a user runs `bun run version:check` and `README.md` plus
  `README.kr.md` match the output generated from `docs/templates/` and
  `plugin.json.version`
- **THEN** the command MUST exit successfully without modifying files

#### Scenario: Generated files drift from templates or plugin version
- **WHEN** a user runs `bun run version:check` and either generated README file
  differs from the expected rendered output
- **THEN** the command MUST fail and report the drift without modifying files

### Requirement: Version bump rolls back on failure
The system SHALL restore all touched files to their original contents when a
version bump operation fails after making a partial change.

#### Scenario: Rendering failure after metadata update
- **WHEN** the version command has updated `plugin.json` but README rendering
  fails before the command completes
- **THEN** the command MUST restore `plugin.json`, `README.md`, and
  `README.kr.md` to their original contents and exit with failure

#### Scenario: Write failure after partial README update
- **WHEN** the version command has written one generated README file but a later
  write fails before the command completes
- **THEN** the command MUST restore `plugin.json`, `README.md`, and
  `README.kr.md` to their original contents and exit with failure
