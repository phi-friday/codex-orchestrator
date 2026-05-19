## ADDED Requirements

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
