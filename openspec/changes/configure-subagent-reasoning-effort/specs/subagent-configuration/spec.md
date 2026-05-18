## ADDED Requirements

### Requirement: Configuration-driven subagent reasoning effort
The installer SHALL read optional subagent `model_reasoning_effort` values from
Codex Orchestrator JSON configuration files and SHALL render the
`model_reasoning_effort` TOML field only when the final value is a non-empty
string.

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

#### Scenario: Blank reasoning effort omits field
- **WHEN** the final configuration enables `designer` with a model and sets
  `agents.designer.model_reasoning_effort` to a blank string
- **THEN** the installer renders `designer.toml` without a
  `model_reasoning_effort` field

#### Scenario: Invalid reasoning effort is rejected
- **WHEN** a configuration file sets `agents.oracle.model_reasoning_effort` to a
  non-string, non-null value
- **THEN** the installer rejects the configuration before planning writes or
  removals

## MODIFIED Requirements

### Requirement: Configuration source precedence
The installer SHALL merge available configuration files in increasing priority:
`~/.codex/codex-orchestrator.json`, then `<cwd>/codex-orchestrator.json`, then
the path provided by `--config`, and SHALL merge recognized per-agent fields
independently.

#### Scenario: Higher-priority config overrides lower-priority model

- **WHEN** the global config sets `agents.orchestrator-explorer.model` to
  `gpt-5.4` and the repository config sets it to `gpt-5.4-codex`
- **THEN** the final model for `orchestrator-explorer` is `gpt-5.4-codex`

#### Scenario: Explicit config has highest priority

- **WHEN** global, repository, and `--config` files all set `agents.fixer.model`
- **THEN** the final model for `fixer` comes from the `--config` file

#### Scenario: Missing higher-priority entry inherits lower-priority config

- **WHEN** the global config sets `agents.orchestrator-explorer.model` and the
  repository config does not include `orchestrator-explorer`
- **THEN** the final model for `orchestrator-explorer` comes from the global
  config

#### Scenario: Higher-priority reasoning effort overrides lower-priority value
- **WHEN** the global config sets `agents.oracle.model_reasoning_effort` to
  `medium` and the repository config sets it to `high`
- **THEN** the final reasoning effort for `oracle` is `high`

#### Scenario: Missing higher-priority reasoning effort inherits lower-priority value
- **WHEN** the global config sets `agents.oracle.model_reasoning_effort` and the
  repository config includes `oracle` without a `model_reasoning_effort` field
- **THEN** the final reasoning effort for `oracle` comes from the global config

### Requirement: Bundled Codex custom agent templates
The plugin SHALL bundle Codex TOML custom agent templates for `designer`,
`orchestrator-explorer`, `fixer`, `librarian`, `observer`, and `oracle`.

#### Scenario: Bundled agent templates exist
- **WHEN** the installer lists bundled subagent templates
- **THEN** it discovers TOML templates for `designer`, `orchestrator-explorer`,
  `fixer`, `librarian`, `observer`, and `oracle`

#### Scenario: Templates use Codex custom agent fields
- **WHEN** a bundled template is rendered for an agent whose final configuration
  includes a non-empty `model_reasoning_effort`
- **THEN** the rendered custom agent definition contains `name`, `description`,
  `model`, `model_reasoning_effort`, and `developer_instructions`

#### Scenario: Templates omit unconfigured reasoning effort
- **WHEN** a bundled template is rendered for an agent whose final configuration
  has no non-empty `model_reasoning_effort`
- **THEN** the rendered custom agent definition contains `name`, `description`,
  `model`, and `developer_instructions`, and does not contain
  `model_reasoning_effort`

#### Scenario: Templates include source provenance
- **WHEN** a bundled template is rendered
- **THEN** the rendered custom agent definition contains TOML comments
  identifying the `oh-my-opencode-slim` version, source repository, source
  commit, source agent file, and Codex adaptation note

#### Scenario: Librarian configures Context7
- **WHEN** the `librarian` template is rendered
- **THEN** the rendered custom agent definition contains a Context7 MCP server
  configuration
