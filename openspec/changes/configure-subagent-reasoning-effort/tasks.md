## 1. Installer Configuration

- [ ] 1.1 Extend installer config agent typing and parsing to accept
  `model_reasoning_effort` as a string or null.
- [ ] 1.2 Merge `model_reasoning_effort` independently so missing fields inherit
  lower-priority config and null removes inherited values.
- [ ] 1.3 Reject non-string, non-null `model_reasoning_effort` values with a
  clear agent-specific error.

## 2. Template Rendering

- [ ] 2.1 Replace fixed bundled template `model_reasoning_effort` lines with an
  installer-controlled optional rendering mechanism.
- [ ] 2.2 Render `model_reasoning_effort = "<value>"` only for enabled agents
  whose final reasoning effort is a non-empty string.
- [ ] 2.3 Omit the `model_reasoning_effort` TOML field when the final value is
  missing, null, or blank.
- [ ] 2.4 Keep `model` as the only enabled/disabled gate for bundled subagents.

## 3. Tests

- [ ] 3.1 Add focused merge tests for inherited, overridden, null, blank, and
  invalid `model_reasoning_effort` values.
- [ ] 3.2 Add template rendering tests that cover both present and omitted
  reasoning effort fields.
- [ ] 3.3 Update bundled install coverage so at least one rendered agent includes
  configured reasoning effort and at least one omits it.
- [ ] 3.4 Update template quality tests that currently assume every rendered
  custom agent contains `model_reasoning_effort`.

## 4. Documentation

- [ ] 4.1 Update the installer skill documentation with the new
  `model_reasoning_effort` config field and null/omission behavior.
- [ ] 4.2 Remove documentation that describes bundled templates as having fixed
  reasoning effort values.

## 5. Verification

- [ ] 5.1 Run `bun run test`.
- [ ] 5.2 Run `bun run typecheck`.
- [ ] 5.3 Run `bun run lint`.
