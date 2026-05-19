## ADDED Requirements

### Requirement: Local subagent install wizard
The plugin SHALL provide a local Node.js wizard for collecting agent-driven
bundled subagent installation choices through a browser form.

#### Scenario: Wizard URL is reported
- **WHEN** an agent starts the local subagent install wizard
- **THEN** the wizard reports the local browser URL that the user can open

#### Scenario: Wizard renders current install context
- **WHEN** the wizard renders the browser form
- **THEN** it shows available configuration sources, target directory choices,
  existing matching bundled agent files, bundled agent descriptions, current
  per-agent model choices, and current per-agent reasoning effort choices

#### Scenario: Wizard accepts custom model values
- **WHEN** the wizard offers per-agent model choices
- **THEN** it allows a user to provide a custom model string for each enabled
  bundled agent

### Requirement: Wizard submit stores answers for Codex
The local subagent install wizard SHALL persist submitted form answers to a
session-scoped JSON file that the Codex agent can read.

#### Scenario: Submitted answers are written to a known file
- **WHEN** the user submits the wizard form
- **THEN** the wizard writes the submitted installation choices to the
  session-scoped answers JSON file

#### Scenario: Wizard submit does not install agents
- **WHEN** the user submits the wizard form
- **THEN** the wizard does not write Codex Orchestrator configuration files, run
  the installer, or modify bundled agent TOML files

#### Scenario: Wizard submit is local and session-scoped
- **WHEN** the wizard accepts a form submission
- **THEN** it accepts the submission only through the local server session that
  rendered the form

## MODIFIED Requirements

### Requirement: Agent-driven installs require user interview
The install-subagents skill SHALL require an agent to interview the user before
running a non-dry-run bundled subagent installation, and SHALL allow the agent
to use the local subagent install wizard as the interview mechanism when the
wizard is available and appropriate.

#### Scenario: Installation intent is gathered

- **WHEN** a user asks an agent to install, refresh, repair, or reinstall bundled
  subagents
- **THEN** the agent presents the available configuration sources, target
  directory choices, existing matching bundled agent files, and per-agent model
  choices before running the non-dry-run installer

#### Scenario: Reasoning effort remains optional
- **WHEN** the agent gathers per-agent model choices
- **THEN** the agent treats reasoning effort as optional and uses existing
  configuration inheritance or omitted values unless the user explicitly
  chooses reasoning effort overrides

#### Scenario: Wizard can collect interview answers
- **WHEN** the local subagent install wizard is available and the user can open
  the reported local URL
- **THEN** the agent may use the submitted wizard answers as the gathered
  installation intent before preparing configuration changes

#### Scenario: Chat interview remains available
- **WHEN** the wizard is unavailable, unsuitable, or declined by the user
- **THEN** the agent gathers installation intent through the existing chat
  interview flow
