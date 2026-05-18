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

The installer reads YAML templates from:

```text
plugins/codex-orchestrator/assets/subagents/
```

Each template contains a `{{MODEL}}` token. The TypeScript installer replaces
that token with each configured subagent model, then writes enabled rendered
YAML files to the target subagent directory. Bundled agents with `model: null`
or no final model are disabled, and any matching previously installed bundled
file is removed from the target directory.

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
    "codebase-explorer": {
      "model": "gpt-5.4"
    },
    "implementation-worker": {
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
4. Run the installer and report installed or removed bundled YAML filenames.
