---
name: install-subagents
description: Install Codex Orchestrator subagent definitions from bundled asset templates using JSON configuration.
license: MIT
compatibility: Requires Node.js.
---

# Install Subagents

Use this skill when the user wants to install or refresh the subagent definitions
bundled with the Codex Orchestrator plugin.

## What It Installs

The installer reads Codex custom agent TOML templates from:

```text
plugins/codex-orchestrator/assets/subagents/
```

Each template contains a `{{MODEL}}` token in its `model` field. The Node
installer replaces that token with each configured subagent model, then writes
enabled rendered TOML files to the target agent directory. Bundled agents with
`model: null` or no final model are disabled, and any matching previously
installed bundled file is removed from the target directory.

The bundled roles are:

- `designer`
- `orchestrator-explorer`
- `fixer`
- `librarian`
- `observer`
- `oracle`

Templates set fixed `model_reasoning_effort` values directly. The `librarian`
template also includes a Context7 MCP server configuration.

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
  "agents": {
    "orchestrator-explorer": {
      "model": "gpt-5.4-mini"
    },
    "fixer": {
      "model": null
    }
  }
}
```

Higher-priority config files override individual per-agent fields from lower
priority files. Set `model` to `null` to disable an inherited bundled agent.
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
