---
name: install-subagents
description: Install Codex Orchestrator subagent definitions from bundled asset templates with a selected model.
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
that token with the model passed through `--model`, then writes the rendered
YAML files to the target subagent directory.

## Command

From the repository root:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs --model gpt-5.4
```

By default, the installer writes to:

```text
~/.codex/agents
```

Use `--target-dir` if this Codex installation expects subagents somewhere else:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs \
  --model gpt-5.4 \
  --target-dir ~/.codex/agents
```

Preview writes without modifying files:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs \
  --model gpt-5.4 \
  --dry-run
```

## Agent Behavior

When using this skill as an agent:

1. Ask for the model only if the user did not provide one.
2. Use `--dry-run` first when the target directory is uncertain.
3. Run the installer with the chosen `--model`.
4. Report the installed YAML filenames and target directory.
