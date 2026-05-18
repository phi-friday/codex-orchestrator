## ADDED Requirements

### Requirement: Published configuration JSON Schema
The plugin SHALL bundle a JSON Schema for Codex Orchestrator configuration files
at `plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json`.

#### Scenario: Schema asset exists
- **WHEN** the plugin is packaged
- **THEN** the bundled assets include
  `assets/schemas/codex-orchestrator.schema.json`

#### Scenario: Schema describes configuration shape
- **WHEN** a user references the bundled schema from `codex-orchestrator.json`
- **THEN** the schema describes a top-level object with an `agents` object whose
  agent entries may define `model` and `model_reasoning_effort`

#### Scenario: Schema restricts reasoning effort values
- **WHEN** the schema describes `model_reasoning_effort`
- **THEN** it accepts only `low`, `medium`, `high`, `xhigh`, or `null`

### Requirement: Installer skill documents schema usage
The install-subagents skill SHALL document how users can reference the bundled
configuration JSON Schema from Codex Orchestrator JSON config files.

#### Scenario: Schema usage is documented
- **WHEN** a user reads the install-subagents skill documentation
- **THEN** the documentation shows a configuration example that references the
  bundled schema

## MODIFIED Requirements

### Requirement: Configuration-driven subagent reasoning effort
The installer SHALL read optional subagent `model_reasoning_effort` values from
Codex Orchestrator JSON configuration files and SHALL render the
`model_reasoning_effort` TOML field only when the final value is one of `low`,
`medium`, `high`, or `xhigh`.

#### Scenario: Agent reasoning effort is configured
- **WHEN** the final configuration contains
  `agents.oracle.model_reasoning_effort` as `high`
- **THEN** the installer renders the bundled `oracle` TOML template with
  `model_reasoning_effort = "high"`

#### Scenario: Missing reasoning effort omits field
- **WHEN** the final configuration enables `fixer` with a model but has no final
  `agents.fixer.model_reasoning_effort`
- **THEN** the installer renders `fixer.toml` without a
  `model_reasoning_effort` field

#### Scenario: Null reasoning effort removes inherited override
- **WHEN** the global config sets `agents.observer.model_reasoning_effort` and a
  higher-priority config sets `agents.observer.model_reasoning_effort` to `null`
- **THEN** the installer renders `observer.toml` without a
  `model_reasoning_effort` field

#### Scenario: Invalid reasoning effort type is rejected
- **WHEN** a configuration file sets `agents.oracle.model_reasoning_effort` to a
  non-string, non-null value
- **THEN** the installer rejects the configuration before planning writes or
  removals

#### Scenario: Unknown reasoning effort string is rejected
- **WHEN** a configuration file sets `agents.oracle.model_reasoning_effort` to a
  string other than `low`, `medium`, `high`, or `xhigh`
- **THEN** the installer rejects the configuration before planning writes or
  removals
