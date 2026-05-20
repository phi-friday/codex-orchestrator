## Context

Codex Orchestrator already ships two separate installation pieces:

- `install-subagents-wizard.mjs` collects structured installation intent through
  a local browser form and exits with submitted answers.
- `install-subagents.mjs` renders bundled subagent TOML files from JSON
  configuration and performs dry-run or write operations.

The safety model depends on the agent collecting intent before any installer
planning or writes. The current `install-subagents` skill says to prefer the
wizard, but it also documents the direct installer command first and the spec
allows the wizard as an optional interview mechanism. That leaves room for
agents to skip the wizard and run the installer CLI directly.

## Goals / Non-Goals

**Goals:**

- Make the browser wizard the required first path for agent-driven install
  interviews when it is available and suitable.
- Keep the installer CLI non-interactive and agent-controlled.
- Preserve the dry-run summary and final confirmation gates.
- Make fallback conditions explicit enough that agents cannot treat speed,
  convenience, or preference as reasons to skip the wizard.
- Add documentation tests that lock in the wizard-first ordering and gating.

**Non-Goals:**

- Do not make the wizard write `codex-orchestrator.json`.
- Do not make the wizard run `install-subagents.mjs` or preview installer
  output.
- Do not remove the chat interview fallback for environments where the local
  browser flow is unavailable or unsuitable.
- Do not change bundled subagent configuration semantics.

## Decisions

### Treat the wizard as the primary interview mechanism

Agent-driven installs should start by attempting the wizard whenever the command
is available and the user can open the reported local URL. This makes the
structured browser flow the default and leaves chat as a fallback, not an equal
choice.

Alternative considered: keep the existing "prefer" wording. That has already
proven too weak because agents can satisfy the broad interview requirement by
running direct installer commands and asking questions in chat.

### Gate installer dry-run behind completed intent collection

`install-subagents.mjs --dry-run` should run only after the agent has either
read wizard-submitted answers or completed the fallback chat interview. Dry-run
is non-destructive, but its selected config and target directory still depend on
the interview outcome, so running it first encourages direct-installer-first
behavior.

Alternative considered: allow dry-run before the interview because it is safe.
That keeps the wrong mental model: the CLI becomes the entrypoint and the
interview becomes an optional refinement.

### Use explicit fallback reasons

The skill should name acceptable fallback cases: wizard command unavailable,
wizard start failure, local URL unsuitable, user cannot open the URL, user
declines the wizard, or wizard timeout. The agent should state the fallback
reason before continuing in chat.

Alternative considered: leave "unavailable, unsuitable, or declined" undefined.
That is concise but lets agents classify routine convenience as unsuitability.

### Surface wizard-first guidance before direct commands

The install skill should present the wizard path before the direct installer
command reference, and the plugin default prompt should mention wizard-first use
when `$install-subagents` is invoked. This puts the intended entrypoint in the
highest-salience agent-facing text.

Alternative considered: update only the spec. Specs guide development, but the
runtime agent behavior is driven by skill and plugin prompt wording.

## Risks / Trade-offs

- More installation attempts may pause on a browser flow -> The fallback path
  remains available when the user cannot or does not want to use the local URL.
- Wizard command failures could block install work -> The fallback reason list
  allows agents to proceed through chat after reporting the failure.
- Stronger wording could imply that the installer CLI is deprecated -> The skill
  should clarify that the CLI remains the required dry-run and install engine
  after intent collection.
