## ADDED Requirements

### Requirement: Installer renders TOML-safe model strings
The installer SHALL render configured string values into bundled subagent TOML
without allowing those values to alter TOML structure.

#### Scenario: Model contains TOML string metacharacters
- **WHEN** the final configuration contains an enabled bundled agent model with
  quotes, backslashes, newlines, tabs, or control characters
- **THEN** the rendered TOML MUST contain the model as a single valid string
  value and MUST NOT create additional TOML keys, tables, or commands.

#### Scenario: Ordinary model value is preserved
- **WHEN** the final configuration contains an enabled bundled agent model such
  as `gpt-5.4-mini`
- **THEN** the rendered TOML MUST preserve that model value exactly after TOML
  parsing.

### Requirement: Installer preserves unmarked target agent files
The installer SHALL NOT overwrite or remove an existing target agent TOML file
unless the file is known to be managed by Codex Orchestrator.

#### Scenario: Enabled bundled agent conflicts with unmarked file
- **WHEN** an enabled bundled agent would write `target_dir/<agent>.toml`
- **AND** that target file already exists without a Codex Orchestrator managed
  marker
- **THEN** the installer MUST fail before writing and report the conflicting
  file path.

#### Scenario: Disabled bundled agent conflicts with unmarked file
- **WHEN** a disabled bundled agent would remove `target_dir/<agent>.toml`
- **AND** that target file already exists without a Codex Orchestrator managed
  marker
- **THEN** the installer MUST preserve the file and report that it was not
  removed because it is not managed by Codex Orchestrator.

#### Scenario: Managed bundled file may be overwritten
- **WHEN** an enabled bundled agent would write `target_dir/<agent>.toml`
- **AND** that target file exists with a Codex Orchestrator managed marker
- **THEN** the installer MAY overwrite it with the newly rendered bundled agent
  definition.

#### Scenario: Managed disabled bundled file may be removed
- **WHEN** a disabled bundled agent would remove `target_dir/<agent>.toml`
- **AND** that target file exists with a Codex Orchestrator managed marker
- **THEN** the installer MAY remove it.

#### Scenario: Provenance comment alone is not ownership proof
- **WHEN** a target agent file contains bundled source provenance comments but
  does not contain the Codex Orchestrator managed marker
- **THEN** the installer MUST treat the file as unmanaged.

### Requirement: Installer dry-run reports conflicts before mutation
The installer SHALL surface planned writes, managed removals, preserved
unmanaged files, and blocking conflicts during dry-run without modifying files.

#### Scenario: Dry-run sees unmanaged overwrite conflict
- **WHEN** dry-run mode encounters an enabled bundled agent whose target file is
  unmanaged
- **THEN** the dry-run output MUST report the conflict and MUST NOT modify the
  target file.

#### Scenario: Dry-run sees unmanaged disabled file
- **WHEN** dry-run mode encounters a disabled bundled agent whose target file is
  unmanaged
- **THEN** the dry-run output MUST report that the file will be preserved and
  MUST NOT modify the target file.

### Requirement: Installer mutation failures identify affected paths
The installer SHALL report the affected path when a write or removal fails
during non-dry-run installation.

#### Scenario: Write fails during install
- **WHEN** non-dry-run installation cannot write a planned target file
- **THEN** the installer MUST exit with failure and report the target file path
  that failed.

#### Scenario: Removal fails during install
- **WHEN** non-dry-run installation cannot remove a planned managed target file
- **THEN** the installer MUST exit with failure and report the target file path
  that failed.
