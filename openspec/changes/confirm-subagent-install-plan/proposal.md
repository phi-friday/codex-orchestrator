## Why

The `install-subagents` skill currently lets agents run the installer after only
minimal setup, while the CLI overwrites matching agent files and removes disabled
bundled files without confirmation. Users need an explicit interview and final
plan review before Codex Orchestrator changes their global or repository-local
custom agent definitions.

## What Changes

- Require the `install-subagents` skill to gather installation intent before
  running the installer.
- Present available configuration sources, target directory choices, existing
  bundled agent files, and per-agent model choices before installation.
- Require agents to run `--dry-run` and summarize planned writes, overwrites,
  removals, and preserved files before modifying the target directory.
- Require final user confirmation of the resolved install plan before executing
  a non-dry-run install.
- Document conservative defaults for existing files, disabled bundled agents,
  target directory selection, and reasoning effort.
- Keep the installer CLI non-interactive unless a later change explicitly adds
  interactive CLI behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `subagent-configuration`: Add user interview, dry-run review, and final
  confirmation requirements for agent-driven bundled subagent installation.

## Impact

- `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`
- `openspec/specs/subagent-configuration/spec.md`
- Installer usage guidance and agent behavior
- Tests or fixtures covering the skill documentation contract
