## Why

The bundled Codex subagent templates are intended to adapt high-quality
reference agents to the Codex runtime, not to replace them with minimal role
summaries. The current requirements allow templates to pass as long as basic
TOML fields exist, which does not protect source intent, constraints, output
contracts, or detailed operating guidance from being lost during adaptation.

## What Changes

- Add quality-preservation requirements for bundled subagent templates.
- Require each template to preserve the source agent's role, behavioral
  guidance, constraints, output expectations, and important nuance unless a
  source instruction is incompatible with Codex.
- Require Codex adaptations to document intentional substitutions or omissions
  for incompatible OpenCode-specific tools, permissions, or runtime concepts.
- Require tests or review fixtures that compare bundled templates against their
  referenced source prompts for semantic coverage.
- Update the existing bundled templates where they currently compress source
  prompts into weaker summaries.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `subagent-configuration`: bundled Codex custom agent templates must preserve
  reference prompt quality and record Codex-specific adaptation decisions.

## Impact

- Affects bundled subagent templates in
  `plugins/codex-orchestrator/assets/subagents/*.toml`.
- Affects installer tests or added fixture tests that validate template quality
  against `references/oh-my-opencode-slim/src/agents/*.ts`.
- Affects installer skill documentation if it describes bundled template
  provenance or adaptation behavior.
