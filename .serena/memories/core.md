# Core

- Repo packages a Codex Orchestrator plugin, not a conventional app; no `src/` app entrypoint is expected.
- Plugin root: `plugins/codex-orchestrator/`.
- Main plugin metadata: `plugins/codex-orchestrator/.codex-plugin/plugin.json`.
- Main orchestration skill: `plugins/codex-orchestrator/skills/codex-orchestrator/SKILL.md`.
- Installer skill/script: `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`, `plugins/codex-orchestrator/scripts/install-subagents.mjs`.
- Bundled custom subagent templates live under `plugins/codex-orchestrator/assets/subagents/*.toml` and use installer tokens such as `{{MODEL}}`.
- Reference source for adapted agent behavior: `references/oh-my-opencode-slim/`.
- Read `mem:tech_stack` for runtime/tooling, `mem:conventions` for style, `mem:suggested_commands` for commands, and `mem:task_completion` before claiming completion.