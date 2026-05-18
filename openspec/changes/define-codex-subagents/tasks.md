## 1. Template Set

- [ ] 1.1 Remove the placeholder `codebase-explorer` and `implementation-worker`
  bundled templates.
- [ ] 1.2 Add Codex TOML templates for `designer`,
  `orchestrator-explorer`, `fixer`, `librarian`, `observer`, and `oracle`.
- [ ] 1.3 Translate each reference role's instructions to Codex terminology,
  preserving useful tool guidance only when Codex or configured MCP/skill
  capabilities can provide it.
- [ ] 1.4 Add fixed `model_reasoning_effort` values to each template and add
  Context7 MCP configuration to the `librarian` template.
- [ ] 1.5 Add TOML provenance comments to each template with the
  `oh-my-opencode-slim` version, source repository, source commit, source agent
  file, and Codex adaptation note.

## 2. Installer

- [ ] 2.1 Update template discovery to install bundled `.toml` templates instead
  of `.yaml` or `.yml` templates.
- [ ] 2.2 Update template name parsing to read the TOML `name = "..."` field.
- [ ] 2.3 Keep `{{MODEL}}` rendering behavior for the `model` field.
- [ ] 2.4 Add scoped cleanup for legacy bundled YAML outputs created by the old
  placeholder templates.

## 3. Tests And Documentation

- [ ] 3.1 Update installer unit tests and CLI subprocess tests for TOML output
  names, new bundled agent names, and legacy YAML cleanup.
- [ ] 3.2 Update the installer skill documentation to describe TOML custom agent
  templates, the six bundled roles, fixed reasoning effort, and provenance
  comments.
- [ ] 3.3 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
