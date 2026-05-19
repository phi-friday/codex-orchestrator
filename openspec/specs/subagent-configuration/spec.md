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

### Requirement: Agent-driven installs require user interview
The install-subagents skill SHALL require an agent to interview the user before
running a non-dry-run bundled subagent installation.

#### Scenario: Installation intent is gathered
- **WHEN** a user asks an agent to install, refresh, repair, or reinstall bundled
  subagents
- **THEN** the agent presents the available configuration sources, target
  directory choices, existing matching bundled agent files, and per-agent model
  choices before running the non-dry-run installer

#### Scenario: Reasoning effort remains optional
- **WHEN** the agent gathers per-agent model choices
- **THEN** the agent treats reasoning effort as optional and uses existing
  configuration inheritance or omitted values unless the user explicitly chooses
  reasoning effort overrides

### Requirement: Agent-driven installs require dry-run review
The install-subagents skill SHALL require an agent to run the installer in
dry-run mode and summarize the resolved plan before running a non-dry-run
installation.

#### Scenario: Dry-run plan is summarized
- **WHEN** the agent has selected the configuration source and target directory
  with the user
- **THEN** the agent runs the installer with `--dry-run` and summarizes the
  resolved target directory, enabled agents, disabled agents, planned writes,
  planned overwrites, planned removals, and files that will be preserved

#### Scenario: Existing files are called out
- **WHEN** the dry-run plan writes to a target path that already exists
- **THEN** the agent explicitly identifies the operation as an overwrite and
  asks whether to overwrite, preserve by changing the plan, or stop

#### Scenario: Removals are called out
- **WHEN** the dry-run plan removes an existing matching bundled agent file
- **THEN** the agent explicitly identifies the operation as a removal and asks
  whether to proceed, preserve by changing the plan, or stop

### Requirement: Agent-driven installs require final confirmation
The install-subagents skill SHALL require final user confirmation after the
dry-run summary and before any non-dry-run installer execution.

#### Scenario: Confirmed plan is installed
- **WHEN** the user confirms the dry-run summary without requesting changes
- **THEN** the agent runs the matching non-dry-run installer command and reports
  installed and removed bundled TOML filenames

#### Scenario: Unconfirmed plan is not installed
- **WHEN** the user does not confirm the dry-run summary or asks to change the
  plan
- **THEN** the agent does not run the non-dry-run installer command

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

### Requirement: Bundled templates preserve source prompt quality
Each bundled Codex custom agent template derived from a reference agent SHALL
preserve the reference prompt's role definition, behavioral guidance,
constraints, output expectations, and specialized operating nuance unless a
specific source instruction is incompatible with Codex.

#### Scenario: Reference obligations remain present
- **WHEN** a bundled template identifies a source agent file in its provenance
  comments
- **THEN** the template's `developer_instructions` preserve the source prompt's
  material role, behavior, constraint, and output obligations in Codex-compatible
  wording

#### Scenario: Templates are not reduced to generic summaries
- **WHEN** a source prompt contains specialized guidance, concrete constraints,
  or a structured output contract
- **THEN** the bundled template retains equivalent guidance, constraints, or
  output structure instead of replacing them with only a brief role summary

### Requirement: Codex adaptations are explicit and justified
Each bundled template SHALL make intentional Codex-specific adaptations
reviewable when source prompt details cannot be carried over directly.

#### Scenario: Incompatible tool names are translated
- **WHEN** a source prompt depends on OpenCode-specific tools, MCP names, or
  runtime behavior that Codex does not provide
- **THEN** the bundled template replaces those details with Codex-available
  capabilities or states that the capability must be used only when configured
  and available

#### Scenario: Material omissions are documented
- **WHEN** a source prompt obligation is intentionally omitted because Codex has
  no equivalent capability or because the instruction would be false in Codex
- **THEN** the bundled template or its quality fixture records the omission and
  the reason

### Requirement: Template quality is verified against source references
The repository SHALL include deterministic verification for bundled subagent
template quality against the referenced source prompts.

#### Scenario: Coverage fixture validates semantic obligations
- **WHEN** the template quality tests run
- **THEN** they verify each bundled template against curated coverage points for
  the referenced source agent's role, behavior, constraints, output format, and
  required Codex adaptation notes

#### Scenario: Excessive compression is detected
- **WHEN** a bundled template removes required source obligations without a
  documented Codex incompatibility
- **THEN** the quality verification fails
