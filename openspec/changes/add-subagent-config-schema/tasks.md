## 1. Schema Asset

- [ ] 1.1 Add `plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json`.
- [ ] 1.2 Define the top-level `agents` object and per-agent `model` /
  `model_reasoning_effort` fields.
- [ ] 1.3 Restrict `model_reasoning_effort` with the JSON Schema `enum` keyword
  for `low`, `medium`, `high`, `xhigh`, and `null`.

## 2. Installer Validation

- [ ] 2.1 Add shared allowed reasoning effort values to
  `plugins/codex-orchestrator/scripts/install-subagents.mjs` without using a
  JavaScript enum.
- [ ] 2.2 Reject unknown `model_reasoning_effort` strings before planning writes
  or removals.
- [ ] 2.3 Keep `null` as the supported inherited-value removal mechanism.
- [ ] 2.4 Remove blank-string omission behavior for configured
  `model_reasoning_effort`; blank strings should be rejected as unknown strings.

## 3. Documentation

- [ ] 3.1 Update `plugins/codex-orchestrator/skills/install-subagents/SKILL.md`
  with a `$schema` example that points at the bundled schema asset.
- [ ] 3.2 Document the accepted reasoning effort values and `null` behavior.

## 4. Tests and Verification

- [ ] 4.1 Add installer tests for accepted reasoning effort values.
- [ ] 4.2 Add installer tests for rejected unknown strings, including blank
  strings.
- [ ] 4.3 Add coverage that the schema asset exists and encodes the allowed
  reasoning effort values with the JSON Schema `enum` keyword.
- [ ] 4.4 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
