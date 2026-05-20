## MODIFIED Requirements

### Requirement: Agent-driven installs require user interview
The install-subagents skill SHALL require an agent to interview the user before
running any bundled subagent installer dry-run or non-dry-run command. When the
local subagent install wizard command is available, suitable, and the user can
open the reported local URL, the agent MUST start the wizard as the primary
interview mechanism before running `install-subagents.mjs`. The agent SHALL use
the chat interview flow only after the wizard is unavailable, unsuitable,
declined by the user, exits unsuccessfully, returns invalid answers, or times
out without submitted answers.

#### Scenario: Installation intent is gathered
- **WHEN** a user asks an agent to install, refresh, repair, or reinstall bundled
  subagents
- **THEN** the agent presents the available configuration sources, target
  directory choices, existing matching bundled agent files, and per-agent model
  choices before running any installer dry-run or non-dry-run command

#### Scenario: Reasoning effort remains optional
- **WHEN** the agent gathers per-agent model choices
- **THEN** the agent treats reasoning effort as optional and uses existing
  configuration inheritance or omitted values unless the user explicitly chooses
  reasoning effort overrides

#### Scenario: Wizard is the primary interview path
- **WHEN** the local subagent install wizard command is available and the user
  can open the reported local URL
- **THEN** the agent MUST start the wizard before running
  `install-subagents.mjs`, including dry-run mode

#### Scenario: Wizard answers gate installer planning
- **WHEN** the user submits answers through the local subagent install wizard
- **THEN** the agent uses the submitted wizard answers as the gathered
  installation intent before preparing configuration changes or running
  installer dry-run mode

#### Scenario: Agent waits for wizard command completion
- **WHEN** the agent starts the local subagent install wizard command
- **THEN** the agent polls the running command session until it exits or times
  out before continuing with configuration preparation or ending the agent turn

#### Scenario: Chat interview remains available
- **WHEN** the wizard command is unavailable, the wizard fails to start, the
  local URL is unsuitable for the user's environment, the user cannot open the
  local URL, the user declines the wizard, the wizard exits non-zero, the
  wizard returns invalid answers, or the wizard exits without submitted answers
- **THEN** the agent states or discusses that fallback reason and gathers
  installation intent through the existing chat interview flow before running
  any installer dry-run or non-dry-run command

## ADDED Requirements

### Requirement: Agent-facing install guidance is wizard-first
The plugin SHALL present the local subagent install wizard as the first
agent-driven installation path in agent-facing guidance, while still documenting
that `install-subagents.mjs` remains the dry-run and install engine after intent
collection.

#### Scenario: Skill documentation prioritizes the wizard
- **WHEN** an agent reads the install-subagents skill documentation
- **THEN** the documentation describes the local install wizard path before
  direct installer command examples and states that direct installer dry-runs
  wait for wizard answers or a completed fallback chat interview

#### Scenario: Plugin prompt mentions wizard-first install flow
- **WHEN** the plugin default prompt instructs an agent to use
  `$install-subagents`
- **THEN** the prompt also tells the agent to attempt the local install wizard
  first and use chat fallback only when the wizard cannot run, is unsuitable,
  is declined, exits unsuccessfully, returns invalid answers, or times out
