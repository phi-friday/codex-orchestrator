## Context

The installer currently merges per-agent JSON fields but only recognizes
`model`. Bundled templates contain a `{{MODEL}}` token for the `model` field and
fixed `model_reasoning_effort` literals such as `"medium"` or `"high"`.

Previous design work described `model_reasoning_effort` as an optional Codex
custom agent session config key, not a required custom agent field. That means
omitting the field from rendered TOML is valid and should leave Codex's default
reasoning behavior in control.

## Goals / Non-Goals

**Goals:**

- Allow each bundled subagent to configure `model_reasoning_effort` independently.
- Allow higher-priority config to remove an inherited reasoning effort override
  with `model_reasoning_effort: null`.
- Omit `model_reasoning_effort` from rendered TOML when the final field is
  missing, null, or blank.
- Keep `model` as the only field that controls whether a bundled subagent is
  enabled or disabled.

**Non-Goals:**

- Preserve fixed reasoning effort defaults from the bundled templates.
- Validate reasoning effort values against a closed enum.
- Add CLI flags for reasoning effort.
- Change the existing target directory, dry-run, unknown-agent, or disabled-agent
  behavior.

## Decisions

### Render optional TOML lines instead of fixed template values

Bundled templates will stop containing fixed `model_reasoning_effort` values.
The installer will render the line only when the final per-agent
`model_reasoning_effort` is a non-empty string.

Alternative considered: keep template defaults and override them only when
configured. That would preserve current output, but it conflicts with the desired
"no input means no reasoning effort override" behavior.

### Treat null as explicit removal

Config merging will handle `model_reasoning_effort` like other per-agent fields:
a missing field inherits lower-priority config, while a present `null` removes an
inherited value. During rendering, null and missing both omit the TOML line.

Alternative considered: reject null and require users to remove lower-priority
config. That makes global defaults harder to override from repository config.

### Validate shape, not semantic enum

The installer will require `model_reasoning_effort` to be a string or null when
present. It will not validate values such as `low`, `medium`, `high`, or future
Codex-supported effort names.

Alternative considered: validate a fixed enum. That could catch typos, but it
risks blocking newer Codex effort values before the plugin updates.

### Keep model as the enabled/disabled gate

A bundled subagent remains enabled only when the final `model` is a non-empty
string. Reasoning effort is optional metadata for an enabled subagent and does
not activate a subagent by itself.

Alternative considered: require both `model` and `model_reasoning_effort` to
enable an agent. That would make an optional Codex field behave like a required
plugin field.

## Risks / Trade-offs

- Existing rendered outputs lose fixed reasoning effort lines unless users add
  config values -> Document the breaking behavior and update examples.
- Blank string values are accepted by type validation but omitted at render time
  -> Test blank strings so the behavior is deliberate.
- Dynamic TOML line rendering is slightly more complex than direct token
  replacement -> Keep the renderer small and cover it with focused tests.
