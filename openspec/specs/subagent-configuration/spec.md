# subagent-configuration Specification

## Purpose
Define how Codex Orchestrator installs, disables, removes, and targets bundled
subagent definitions from JSON configuration files.
## Requirements
### Requirement: Configuration-driven subagent models
The installer SHALL read subagent model selections from Codex Orchestrator JSON
configuration files instead of accepting a shared `--model` option, and SHALL
render matching bundled TOML templates with the configured model value.

#### Scenario: Agent model is configured

- **WHEN** the final configuration contains `agents.orchestrator-explorer.model`
  as a non-empty string
- **THEN** the installer renders the bundled `orchestrator-explorer` TOML
  template with that model value

#### Scenario: Shared model option is removed

- **WHEN** the installer is run with `--model`
- **THEN** the installer rejects the option

### Requirement: Configuration source precedence
The installer SHALL merge available configuration files in increasing priority:
`~/.codex/codex-orchestrator.json`, then `<cwd>/codex-orchestrator.json`, then
the path provided by `--config`.

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

### Requirement: Disabled agents are removed
The installer SHALL treat a final missing model or `model: null` as disabled for
each bundled subagent and SHALL remove that bundled subagent's output file from
the target directory when present.

#### Scenario: Null model disables inherited agent

- **WHEN** the global config sets `agents.fixer.model` and a higher-priority
  config sets `agents.fixer.model` to `null`
- **THEN** the installer does not write `fixer.toml`

#### Scenario: Disabled installed file is removed

- **WHEN** the final configuration disables `fixer` and `fixer.toml` exists in
  the target directory
- **THEN** the installer removes `fixer.toml`

#### Scenario: Unrelated files are preserved

- **WHEN** the final configuration disables `fixer` and the target directory
  contains files that do not correspond to bundled templates
- **THEN** the installer leaves those unrelated files unchanged

### Requirement: Target directory defaults

The installer SHALL derive the default target directory from the highest-priority
non-explicit configuration source when `--target-dir` is not provided.

#### Scenario: Repository config defaults to repository agent directory

- **WHEN** `<cwd>/codex-orchestrator.json` exists and `--config` is not provided
- **THEN** the default target directory is `<cwd>/.codex/agents`

#### Scenario: Global-only config defaults to global agent directory

- **WHEN** `~/.codex/codex-orchestrator.json` exists, `<cwd>/codex-orchestrator.json`
  does not exist, and `--config` is not provided
- **THEN** the default target directory is `~/.codex/agents`

#### Scenario: Explicit config requires explicit target directory

- **WHEN** `--config` is provided without `--target-dir`
- **THEN** the installer fails before planning writes or removals

### Requirement: Missing configuration fails

The installer SHALL fail when no global, repository-local, or explicit
configuration file is available.

#### Scenario: No configuration files exist

- **WHEN** the installer runs without `--config`, no global config exists, and no
  repository config exists
- **THEN** the installer reports that no Codex Orchestrator configuration was
  found

### Requirement: Dry-run reports planned changes
The installer SHALL support dry-run mode for configuration-driven installs and
SHALL report planned writes and removals without modifying files.

#### Scenario: Dry-run reports writes and removals

- **WHEN** dry-run mode is enabled and the final configuration enables
  `orchestrator-explorer` but disables `fixer`
- **THEN** the installer reports a planned write for
  `orchestrator-explorer.toml` and a planned removal for `fixer.toml` when that
  disabled output exists

### Requirement: Bundled Codex custom agent templates
The plugin SHALL bundle Codex TOML custom agent templates for `designer`,
`orchestrator-explorer`, `fixer`, `librarian`, `observer`, and `oracle`.

#### Scenario: Bundled agent templates exist
- **WHEN** the installer lists bundled subagent templates
- **THEN** it discovers TOML templates for `designer`, `orchestrator-explorer`,
  `fixer`, `librarian`, `observer`, and `oracle`

#### Scenario: Templates use Codex custom agent fields
- **WHEN** a bundled template is rendered
- **THEN** the rendered custom agent definition contains `name`, `description`,
  `model`, `model_reasoning_effort`, and `developer_instructions`

#### Scenario: Templates include source provenance
- **WHEN** a bundled template is rendered
- **THEN** the rendered custom agent definition contains TOML comments
  identifying the `oh-my-opencode-slim` version, source repository, source
  commit, source agent file, and Codex adaptation note

#### Scenario: Librarian configures Context7
- **WHEN** the `librarian` template is rendered
- **THEN** the rendered custom agent definition contains a Context7 MCP server
  configuration

