## 1. Quality Baseline

- [ ] 1.1 Extract the source prompt obligations for `designer`,
  `orchestrator-explorer`, `fixer`, `librarian`, `observer`, and `oracle` from
  `references/oh-my-opencode-slim/src/agents/*.ts`.
- [ ] 1.2 Define curated coverage points for each bundled template covering
  role, behavior, constraints, output expectations, and specialized guidance.
- [ ] 1.3 Define required Codex adaptation notes for OpenCode-specific tools,
  MCP names, permissions, or runtime assumptions that cannot be preserved
  directly.

## 2. Template Updates

- [ ] 2.1 Update `orchestrator-explorer.toml` so it preserves the source
  explorer prompt's tool-selection guidance, read-only constraints, exhaustive
  but concise behavior, and structured output contract.
- [ ] 2.2 Update `fixer.toml` so it preserves the source fixer prompt's
  implementation-only scope, no-research/no-delegation constraints, validation
  expectations, insufficient-context handling, and no-change output contract.
- [ ] 2.3 Update `librarian.toml` so it preserves the source librarian prompt's
  documentation/repository research role, source evidence expectations,
  official-vs-community distinction, and Codex-compatible tool substitutions.
- [ ] 2.4 Update `oracle.toml` so it preserves the source oracle prompt's
  strategic review/debugging/architecture responsibilities, simplicity bias,
  read-only constraints, and concrete evidence expectations.
- [ ] 2.5 Update `observer.toml` so it preserves the source observer prompt's
  visual inspection scope, exact-text extraction requirements, uncertainty
  handling, token-saving rationale, and language matching.
- [ ] 2.6 Update `designer.toml` so it preserves the source designer prompt's
  typography, color, motion, spatial composition, visual depth, styling,
  review, and output-quality guidance while adapting framework assumptions to
  Codex.
- [ ] 2.7 Add or update adaptation comments/fixtures documenting intentional
  substitutions or omissions for each template.

## 3. Verification

- [ ] 3.1 Add deterministic template quality tests that validate each bundled
  template against the curated coverage points and adaptation notes.
- [ ] 3.2 Keep existing installer rendering tests passing for TOML discovery,
  model replacement, disabled-agent removal, and bundled agent output names.
- [ ] 3.3 Update installer skill documentation to state that bundled templates
  are quality-preserving Codex adaptations, not minimal summaries.
- [ ] 3.4 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
