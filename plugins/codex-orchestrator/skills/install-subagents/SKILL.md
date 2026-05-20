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

## Local Interview Wizard

When the user can open a local browser URL and the wizard command is available
and suitable, the agent must start the local interview wizard before running
install-subagents.mjs:

```bash
node plugins/codex-orchestrator/scripts/install-subagents-wizard.mjs
```

After the Node server starts, report the printed `wizard url` to the user. The
wizard renders available configuration sources, target directory choices,
matching installed bundled agent files, bundled agent descriptions, current
per-agent model choices, and current per-agent reasoning effort choices.

The wizard uses a minimal local `POST /submit` endpoint to write submitted
answers to the printed `answers path`. It does not write
`codex-orchestrator.json`, run `install-subagents.mjs`, or modify agent TOML
files. After the user submits the form, the wizard closes the local server,
reads the answers JSON, prints the submitted answers, and exits. If no answers
arrive before the timeout, the wizard exits with a timeout error.

While the wizard command is running, keep the command session open and poll it
regularly for completion instead of ending the agent turn and waiting for the
user to report that they submitted the form. Once the command exits, continue
with the normal agent-controlled flow: read or use the printed submitted
answers, prepare or update configuration, run install-subagents.mjs --dry-run
only after wizard-submitted answers or a completed fallback chat interview,
summarize the plan, and ask for final user confirmation before any non-dry-run
install.

Use the chat interview flow below only when the wizard is unavailable,
unsuitable for the user's environment, fails to start, the user cannot open the
local URL, the user declines, the wizard exits non-zero, the wizard returns
invalid answers, or the wizard exits without submitted answers, including a
timeout.

## Command

The Node installer remains the dry-run and install engine after intent has been
collected through wizard answers or a completed fallback chat interview.

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

Preview writes and removals without modifying files after interview answers
have been collected:

```bash
node plugins/codex-orchestrator/scripts/install-subagents.mjs \
  --dry-run
```

## Agent Behavior

When using this skill as an agent:

1. Interview before planning.
   - When the user can open the reported local URL and the wizard command is
     available and suitable, start the wizard, report the `wizard url`, wait for
     the command to print submitted answers and exit, and read the
     `answers path` JSON before preparing configuration changes. Do this by
     polling the running command session until it exits or times out; do not
     finish the agent response while the wizard command is still running.
   - Fall back to a chat interview only when the wizard is unavailable,
     unsuitable for the user's environment, fails to start, the user cannot open
     the local URL, the user declines, the wizard exits non-zero, the wizard
     returns invalid answers, or the wizard exits without submitted answers,
     including a timeout. State or discuss that fallback reason before
     continuing.
   - Identify available configuration sources: global
     `~/.codex/codex-orchestrator.json`, repository-local
     `<cwd>/codex-orchestrator.json`, and any explicit config path the user
     wants to provide.
   - Present target directory choices, including `~/.codex/agents`,
     `<cwd>/.codex/agents`, and any user-specified directory.
   - Inspect the selected target directory when it exists and call out existing
     matching bundled agent files for `designer`, `orchestrator-explorer`,
     `fixer`, `librarian`, `observer`, and `oracle`.
   - Gather enabled agents, disabled agents, and per-agent model choices from
     the user or the selected config files before any non-dry-run install.
   - Treat reasoning effort as an optional override. Use existing config
     inheritance or omitted values unless the user explicitly asks to set or
     remove `model_reasoning_effort`.
2. Resolve the command plan.
   - Ensure a global, repository-local, or explicit JSON config exists.
   - Use `--target-dir` whenever passing `--config`.
   - Preserve the CLI contract: it is non-interactive, and the agent is
     responsible for user questions and confirmation.
3. Run `--dry-run` after selecting config and target choices.
   - Run install-subagents.mjs --dry-run only after wizard-submitted answers or
     a completed fallback chat interview.
   - Summarize the resolved configuration source, target directory, enabled
     agents, disabled agents, planned writes, planned overwrites, planned
     removals, and files that will be preserved.
   - Treat any planned write whose target file already exists as a planned
     overwrite. Explain that the current CLI cannot selectively skip a planned
     write; if the user does not approve, adjust the plan by changing config or
     target directory, or stop.
   - Treat any disabled bundled agent file that exists in the target directory
     as a planned removal. If the user does not approve, adjust the plan by
     changing config or target directory, or stop.
4. Get final user confirmation.
   - Ask for final user confirmation after the dry-run summary and before
     running the matching non-dry-run installer command.
   - If the user rejects, changes, or does not confirm the dry-run summary, the
     agent must not run the non-dry-run installer.
5. Run the installer only after confirmation, then report installed and removed
   bundled TOML filenames.
