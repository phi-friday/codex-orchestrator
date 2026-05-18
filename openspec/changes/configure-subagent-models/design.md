## Context

The installer currently accepts one required `--model` argument, renders every
bundled YAML template with that same value, and writes all rendered files to
`~/.codex/agents` unless `--target-dir` is provided. This makes every bundled
subagent active and forces all roles to use the same model.

Codex Orchestrator needs configuration-driven installation so users can choose
models per subagent role and disable roles in a reversible way. The installer is
a Node.js script in a Bun-managed repository, so the implementation should use
Node built-ins and avoid new runtime dependencies.

## Goals / Non-Goals

**Goals:**

- Replace the shared `--model` workflow with JSON configuration.
- Support global, repository-local, and explicit config files with predictable
  precedence.
- Allow higher-priority config to disable a model inherited from lower-priority
  config by setting `model: null`.
- Remove previously installed bundled files when the final config disables an
  agent.
- Select a safe default target directory when no explicit config is supplied.
- Keep dry-run behavior useful by reporting both planned writes and planned
  removals.

**Non-Goals:**

- Supporting non-JSON config formats.
- Managing user-created subagent definitions outside the bundled template names.
- Auto-discovering target directories from arbitrary explicit config paths.
- Preserving compatibility with the removed `--model` option.

## Decisions

### Config Shape

Use:

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

Only bundled template names are actionable. Unknown agent keys can be ignored by
the installer because they do not map to bundled templates.

Alternative considered: a flat map such as `{ "codebase-explorer": "gpt-5.4" }`.
The nested shape leaves room for future per-agent fields without another
breaking config migration.

### Config Discovery and Merge

Load available configs in this order:

1. `~/.codex/codex-orchestrator.json`
2. `<cwd>/codex-orchestrator.json`
3. `--config <path>`

Merge at the per-agent property level so higher-priority files can override or
disable individual agents without repeating every configured agent. A missing
agent entry means "inherit lower-priority config." A present `model: null` means
"disable this agent."

Alternative considered: treating each config as a full replacement. That would
make repository-local overrides noisy and would require users to repeat global
agent configuration whenever they customize one role.

### Target Directory Selection

When `--config` is present, require `--target-dir`. An explicit config path does
not reliably indicate whether the user intends a global, repository-local, or
temporary install.

Without `--config`, default target directory by the highest-priority discovered
non-explicit config:

- If `<cwd>/codex-orchestrator.json` exists, use `<cwd>/.codex/agents`.
- Otherwise, if only global config exists, use `~/.codex/agents`.

If no config exists, fail before planning writes or removals.

### Disable and Removal Behavior

For each bundled template, derive the agent name from the template YAML `name`
field when possible. If the final config has a string `model`, render and write
that template. If the final config has no string model, treat the agent as
disabled and remove the corresponding output file from the target directory when
it exists.

Removal is scoped to bundled template output paths only. The installer must not
delete unrelated files in the target directory.

## Risks / Trade-offs

- Config merge semantics can be surprising if users expect replacement behavior
  → Document inheritance and `model: null` explicitly in the installer skill.
- Ignoring unknown agent keys can hide typos
  → Prefer warning about unknown configured agents while continuing.
- Deleting disabled bundled files can remove user-edited copies
  → Scope deletion strictly to bundled output filenames and make dry-run show
  removals before execution.
- Requiring `--target-dir` with `--config` is less convenient
  → The explicitness prevents accidental writes to the wrong global or
  repository-local agent directory.
