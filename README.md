# Codex Orchestrator

[한국어](./README.kr.md) | English

Codex Orchestrator is a Codex plugin that adapts the agent-routing ideas from
[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) for
Codex. It provides a default orchestration skill, bundled custom-agent templates,
and hooks that can nudge substantive coding work toward a parent-agent plus
subagent workflow.

> [!IMPORTANT]
> Use this plugin at your own risk. You are solely responsible for installing,
> enabling, reviewing, and operating this plugin, including any skills, hooks,
> subagents, commands, model usage, costs, and file changes it triggers.

## Origin: oh-my-opencode-slim

This project is a Codex-native adaptation of
[`oh-my-opencode-slim`](https://github.com/alvinunreal/oh-my-opencode-slim), a
lightweight OpenCode orchestration plugin created by
[`alvinunreal`](https://github.com/alvinunreal). The source project routes work
across specialized agents so one main agent does not need to handle every
activity alone.

The bundled Codex custom-agent templates in this repository preserve the source
roles and routing intent where practical, while replacing OpenCode-specific
runtime behavior with Codex-compatible skills, custom-agent TOML files, and
plugin hooks.

This repository currently references `oh-my-opencode-slim` version `1.1.1`.
Bundled subagent templates include provenance comments with the referenced source
repository, commit, source agent file, and adaptation notes. Third-party license
details are recorded in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## What This Plugin Provides

- `codex-orchestrator` skill: default orchestration guidance for substantive
  coding-agent work.
- `install-subagents` skill: an installation flow for rendering bundled Codex
  custom-agent templates from JSON configuration.
- Bundled subagent templates:
  - `orchestrator-explorer`
  - `librarian`
  - `oracle`
  - `designer`
  - `fixer`
  - `observer`
- Optional hooks for `UserPromptSubmit` and `Stop` events.
- A marketplace catalog so Codex can discover this plugin when this repository
  is added as a marketplace source.

## How Orchestration Works

The parent Codex agent remains responsible for the critical path, integration,
and verification. Subagents are used for independent work such as codebase
reconnaissance, documentation research, bounded implementation, visual review,
strategic review, and focused verification lanes.

The orchestration skill is intentionally "mandatory by default" for substantive
coding work unless the user explicitly opts out. Local-only work is still valid
for trivial checks, exact known-file lookups, unavailable specialists, or
immediately blocking critical-path work with no independent lane.

## Plugin Layout

```text
plugins/codex-orchestrator/
  .codex-plugin/plugin.json
  assets/
    schemas/codex-orchestrator.schema.json
    subagents/*.toml
  hooks/
    hooks.json
    orchestrator-hook.mjs
    orchestrator-enforcement.mjs
  scripts/
    install-subagents.mjs
    install-subagents-wizard.mjs
  skills/
    codex-orchestrator/SKILL.md
    install-subagents/SKILL.md
```

## Add The Plugin Through A Marketplace

Add this repository as a Git marketplace source:

```bash
codex plugin marketplace add https://github.com/phi-friday/codex-orchestrator --ref v0.1.0
```

Or, with GitHub shorthand:

```bash
codex plugin marketplace add phi-friday/codex-orchestrator --ref v0.1.0
```

This repository includes a marketplace file at:

```text
.agents/plugins/marketplace.json
```

Codex fetches the Git marketplace source, reads that marketplace file as a
plugin catalog, and uses the `codex-orchestrator` entry to install the plugin.
Keep this file in the repository so Codex can discover the plugin through the
marketplace flow.

Use `--ref` to pin the branch, tag, or commit you want Codex to fetch.

## Marketplace Install Smoke Gate

Before publishing a release tag, run a fresh marketplace install smoke check with
a pinned ref:

1. Use a clean Codex home or disposable test environment.
2. Add the Git marketplace source with
   `codex plugin marketplace add phi-friday/codex-orchestrator --ref v0.1.0`.
3. Confirm the marketplace catalog resolves the `codex-orchestrator` plugin.
4. Install the plugin through the marketplace flow and confirm the
   `codex-orchestrator` and `install-subagents` skills resolve.
5. Confirm `hooks/hooks.json` resolves from the installed plugin root.
6. From the installed plugin root, run the bundled installer in dry-run mode
   with a test configuration:

```bash
node scripts/install-subagents.mjs \
  --config /tmp/codex-orchestrator-smoke.json \
  --target-dir /tmp/codex-orchestrator-smoke-agents \
  --dry-run
```

## Configure Bundled Subagents

After installing the plugin, configure which bundled subagents should be
available and which model each one should use. The configuration file is the
main input for generating the bundled custom-agent definitions.

Configuration is read in increasing precedence from:

```text
~/.codex/codex-orchestrator.json
<cwd>/codex-orchestrator.json
--config <path>
```

Example `codex-orchestrator.json`:

```json
{
  "$schema": "./plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json",
  "agents": {
    "orchestrator-explorer": {
      "model": "gpt-5.4-mini",
      "model_reasoning_effort": "medium"
    },
    "fixer": {
      "model": "gpt-5.4-mini",
      "model_reasoning_effort": "low"
    },
    "oracle": {
      "model": null
    }
  }
}
```

Set `model` to the Codex model you want that subagent to use. Set `model` to
`null` to keep a bundled subagent disabled. Set `model_reasoning_effort` only
when you want to override Codex's default reasoning effort for that subagent;
allowed values are `low`, `medium`, `high`, `xhigh`, and `null`.

## Hooks And Permission Notes

This plugin declares Codex plugin hooks in
`plugins/codex-orchestrator/hooks/hooks.json`. They run Node commands for:

- `UserPromptSubmit`: adds orchestration context for applicable coding prompts.
- `Stop`: checks assistant response text for mentions of orchestration or a
  valid local-only reason, cleanup, and verification before finishing. This is a
  text-based completion nudge; it does not independently prove that subagents
  were closed or that verification commands actually ran.

Hooks only run when plugin hooks are enabled in the Codex environment:

```toml
[features]
plugin_hooks = true
```

Before enabling hooks or installing marketplace plugins, review the plugin source
and understand that hook commands execute locally with the permissions granted by
your Codex environment. This plugin's hooks run Node scripts from the plugin
directory. The `librarian` bundled agent template also configures a Context7 MCP
server, so documentation lookup may involve network access when that agent and
MCP server are enabled.

## Development

Install dependencies:

```bash
bun install
```

Run verification:

```bash
bun run test
bun run typecheck
bun run lint
bun run version:check
```

Refresh the vendored `oh-my-opencode-slim` reference snapshot version declared
in `package.json`:

```bash
bun run reference:oh-my-opencode-slim
```
