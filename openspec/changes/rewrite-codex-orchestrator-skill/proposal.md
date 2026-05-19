## Why

The bundled `codex-orchestrator` skill is currently a placeholder and does not carry the operational judgment from the referenced OpenCode orchestrator. Codex cannot use OpenCode agent profiles directly, so the plugin needs a Codex-native skill that teaches the parent agent when, how, and why to delegate work to subagents while keeping integration and verification under parent control.

## What Changes

- Replace the placeholder `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md` with a complete Codex orchestration skill derived from `references/oh-my-opencode-slim/src/agents/orchestrator.ts`.
- Translate OpenCode-specific mechanisms such as named `@agent` references, `subtask`, `auto_continue`, session reuse, and disabled-agent prompt filtering into Codex-appropriate guidance.
- Preserve the source orchestrator's core workflow: understand, select a path by quality/speed/cost/reliability, check delegation before acting, split independent work, execute, validate, and verify.
- Include routing guidance for bundled Codex subagent templates: `orchestrator-explorer`, `librarian`, `oracle`, `designer`, `fixer`, and `observer`.
- Capture observer-specific handling from the source repository: observer is special-purpose visual/media analysis, should receive full file paths, helps isolate large image/PDF bytes from the parent context, and may be unavailable unless installed/configured with suitable vision capability.
- Document fallback behavior when bundled subagents are not installed, using Codex's available `explorer`, `worker`, and `default` subagent roles.
- Add implementation tasks that require checking both the source prompt builder and repository documentation/tests rather than copying only the visible prompt string.

## Capabilities

### New Capabilities

- `orchestrator-skill-guidance`: Defines the expected behavior of the Codex orchestration skill, including delegation checks, subagent routing, prompt shape, observer handling, fallback behavior, integration, and verification.

### Modified Capabilities

- None.

## Impact

- Affects `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`.
- Requires reference review of `references/oh-my-opencode-slim/src/agents/orchestrator.ts`, related agent factory/configuration files, and source repository README/codemap material.
- May affect documentation expectations for users invoking `$codex-orchestrator`, but does not require runtime code changes, dependencies, or installer changes.
