## Context

The installer reads `codex-orchestrator.json` from global, repository-local, or
explicit paths and validates the shape directly in
`plugins/codex-orchestrator/scripts/install-subagents.mjs`. Users currently need
to infer the JSON shape from documentation, and the installer accepts any
non-null string for `model_reasoning_effort`.

The repository already treats `plugins/codex-orchestrator/assets/subagents/` as
bundled plugin data. A JSON Schema for user configuration has the same
distribution profile: it is not runtime source code, but it should be shipped
with the plugin and referenced from documentation.

## Goals / Non-Goals

**Goals:**

- Ship a JSON Schema asset for `codex-orchestrator.json`.
- Keep the schema close to other plugin assets without mixing it into subagent
  TOML templates.
- Restrict `model_reasoning_effort` to Codex-supported values while preserving
  `null` as an explicit inherited-value removal.
- Keep installer validation and schema validation aligned.
- Avoid JavaScript enum constructs in the Node `.mjs` installer while using
  normal JSON Schema keywords where appropriate.

**Non-Goals:**

- Do not add a JSON Schema validation dependency to the installer.
- Do not change configuration precedence, target directory defaults, or bundled
  subagent enablement rules.
- Do not validate model identifiers beyond requiring a string or `null`.

## Decisions

1. Store the schema at
   `plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json`.

   This keeps the schema in the plugin's bundled asset tree while separating it
   from installable TOML templates. Alternative considered: place the schema
   under `scripts/`, but that makes a user-facing contract look like an
   implementation helper.

2. Use the JSON Schema `enum` keyword for `model_reasoning_effort`.

   JSON Schema has native support for closed value sets, and `enum` is the most
   direct way to express that contract to editors and validation tools. The
   accepted values are `low`, `medium`, `high`, `xhigh`, and `null`.

3. Validate reasoning effort in the installer with a shared allowed-value list
   or set, not a JavaScript enum.

   The `.mjs` script should keep plain Node runtime semantics and avoid
   TypeScript-style enum constructs or generated enum objects. A module-level
   constant such as an array or `Set` is enough for validation and can also be
   reused in error messages.

4. Keep blank-string behavior explicit.

   Existing behavior omits rendered `model_reasoning_effort` when the final
   value is a blank string. With restricted values, blank strings become invalid
   in configuration instead of silently omitting the field. `null` remains the
   explicit way to clear an inherited value.

## Risks / Trade-offs

- Existing configs that used blank strings or misspelled reasoning effort values
  will fail validation. → Document `null` as the supported removal mechanism and
  update tests to cover the new error.
- JSON Schema and installer validation can drift. → Keep tests focused on
  accepted values, rejected strings, and the schema asset's expected shape.
- The schema will not be enforced automatically by the installer. → Installer
  validation remains the source of runtime enforcement; the schema improves
  editor and user feedback.
