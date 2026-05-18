## 1. Installer Configuration

- [x] 1.1 Extend installer config agent typing and parsing to accept
  `model_reasoning_effort` as a string or null.
- [x] 1.2 Merge `model_reasoning_effort` independently so missing fields inherit
  lower-priority config and null removes inherited values.
- [x] 1.3 Reject non-string, non-null `model_reasoning_effort` values with a
  clear agent-specific error.

## 2. Template Rendering

- [x] 2.1 Replace fixed bundled template `model_reasoning_effort` lines with an
  installer-controlled optional rendering mechanism.
- [x] 2.2 Render `model_reasoning_effort = "<value>"` only for enabled agents
  whose final reasoning effort is a non-empty string.
- [x] 2.3 Omit the `model_reasoning_effort` TOML field when the final value is
  missing, null, or blank.
- [x] 2.4 Keep `model` as the only enabled/disabled gate for bundled subagents.

## 3. Tests

- [x] 3.1 Add focused merge tests for inherited, overridden, null, blank, and
  invalid `model_reasoning_effort` values.
- [x] 3.2 Add template rendering tests that cover both present and omitted
  reasoning effort fields.
- [x] 3.3 Update bundled install coverage so at least one rendered agent includes
  configured reasoning effort and at least one omits it.
- [x] 3.4 Update template quality tests that currently assume every rendered
  custom agent contains `model_reasoning_effort`.

## 4. Documentation

- [x] 4.1 Update the installer skill documentation with the new
  `model_reasoning_effort` config field and null/omission behavior.
- [x] 4.2 Remove documentation that describes bundled templates as having fixed
  reasoning effort values.

## 5. Verification

- [x] 5.1 Run `bun run test`.
- [x] 5.2 Run `bun run typecheck`.
- [x] 5.3 Run `bun run lint`.
