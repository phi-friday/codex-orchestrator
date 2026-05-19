---
name: install-subagents
description: Install Codex Orchestrator subagent definitions from bundled asset templates using JSON configuration.
license: MIT
compatibility: Requires Node.js.
---

# Install Subagents

Use this skill when the user wants to install or refresh the subagent definitions
bundled with the Codex Orchestrator plugin.

The plugin also bundles lifecycle hooks that nudge Codex toward the orchestrator
workflow by default. Those hooks only run when Codex plugin hooks are enabled in
the user's environment:

```toml
[features]
plugin_hooks = true
```

## What It Installs

The installer reads Codex custom agent TOML templates from:

```text
plugins/codex-orchestrator/assets/subagents/
```

Each template contains installer tokens for the configured `model` and optional
`model_reasoning_effort` fields. The Node installer renders each enabled
subagent from the final per-agent configuration, then writes enabled rendered
TOML files to the target agent directory. Bundled agents with `model: null` or
no final model are disabled, and any matching previously installed bundled file
is removed from the target directory.

The bundled roles are:

- `designer`
- `orchestrator-explorer`
- `fixer`
- `librarian`
- `observer`
- `oracle`

The installer writes `model_reasoning_effort` only when the final per-agent
configuration contains one of `low`, `medium`, `high`, or `xhigh`. Missing or
null reasoning effort omits the TOML field and leaves Codex's default behavior
in control. The `librarian` template also includes a Context7 MCP server
configuration.

The bundled templates are quality-preserving Codex adaptations of their
referenced `oh-my-opencode-slim` agents. They are not minimal role summaries:
the source agent's role, behavior, constraints, output expectations, and
specialized guidance should remain present unless a source instruction is
incompatible with Codex. Each template starts with TOML provenance comments
identifying the referenced version, repository, commit, source agent file, and
Codex adaptation notes for intentional tool, permission, or runtime
substitutions.

## Configuration

The installer reads JSON config from these locations, in increasing precedence:

```text
~/.codex/codex-orchestrator.json
<cwd>/codex-orchestrator.json
--config <path>
```

Use this shape:

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
      "model_reasoning_effort": null
    },
    "oracle": {
      "model": null
    }
  }
}
```

Higher-priority config files override individual per-agent fields from lower
priority files. Set `model` to `null` to disable an inherited bundled agent.
Set `model_reasoning_effort` to `null` to remove an inherited reasoning effort
override while keeping the agent enabled when its final `model` is a non-empty
string. Accepted reasoning effort values are `low`, `medium`, `high`, and
`xhigh`; other strings, including blank strings, are rejected.
Unknown agent names are ignored with a warning.

## Command

From the repository root:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs
```

When using repository config at `<cwd>/codex-orchestrator.json`, the installer
defaults to:

```text
<cwd>/.codex/agents
```

When only global config exists, it defaults to:

```text
~/.codex/agents
```

Use `--config` with `--target-dir` for an explicit config path:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs \
  --config ./codex-orchestrator.json \
  --target-dir ~/.codex/agents
```

Preview writes and removals without modifying files:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs \
  --dry-run
```

## Agent Behavior

When using this skill as an agent:

1. Ensure a global, repository-local, or explicit JSON config exists.
2. Use `--dry-run` first when planned removals or the target directory are uncertain.
3. Use `--target-dir` whenever passing `--config`.
4. Run the installer and report installed or removed bundled TOML filenames.
