## Context

The bundled subagent templates currently identify their upstream source files,
but the repository requirements only verify that rendered TOML files contain
basic Codex custom agent fields. That allows a template to be structurally
valid while losing the source prompt's detailed role definition, behavioral
constraints, output contract, or examples.

The expected adaptation standard is higher: reference prompts should remain
recognizable in quality and operational specificity after translation to Codex.
Only runtime-incompatible details should change, such as OpenCode-only tool
names, permission models, or agent configuration fields.

## Goals / Non-Goals

**Goals:**

- Preserve source prompt intent, constraints, output formats, and important
  nuance in each bundled Codex subagent template.
- Make Codex-specific adaptations explicit and reviewable.
- Add verification that detects excessive summarization or accidental removal of
  source prompt obligations.
- Keep generated templates valid Codex custom agent TOML.

**Non-Goals:**

- Perfect byte-for-byte reproduction of upstream OpenCode prompts.
- Emulating OpenCode-only tools or permissions in Codex.
- Adding a new prompt transpiler or LLM-based prompt conversion pipeline.
- Changing model selection or installer configuration semantics.

## Decisions

### Treat prompt adaptation as semantic preservation

Each bundled template should preserve the source agent's operational contract:
role, usage boundaries, behavioral rules, constraints, output expectations, and
specialized guidance. The wording may change for Codex, but the resulting agent
must not become a weaker generic summary.

Alternative considered: require near-verbatim prompt copies. That would protect
detail, but it would also preserve incompatible OpenCode tool names and runtime
assumptions that Codex agents cannot satisfy.

### Require adaptation notes for intentional deviations

Each template already has provenance comments. Extend that practice with a short
Codex adaptation note in the template comments or adjacent review fixture. The
note should identify material substitutions or omissions, such as replacing
`grep` or `glob` tool names with `rg` guidance, removing unavailable MCP names,
or changing permissions to `sandbox_mode`.

Alternative considered: keep all adaptation rationale only in the design doc.
That makes the initial change understandable but does not help future template
updates or upstream comparisons.

### Verify coverage with deterministic fixtures

Add a focused test fixture or helper that maps each bundled template to its
source prompt and required coverage points. The coverage points should be human
curated, not inferred by brittle full-text matching. Tests should assert that
required obligations appear in the Codex template and that known incompatible
source concepts are either translated or explicitly noted.

Alternative considered: compare prompt lengths or require a minimum token count.
That catches extreme shrinkage but does not prove the right details were kept.

### Keep Codex validity checks separate from quality checks

Existing installer tests should continue to prove template discovery, rendering,
and file output. New quality checks should focus on template content and source
coverage so failures explain whether the issue is TOML rendering or prompt
adaptation.

Alternative considered: fold quality assertions into the installer subprocess
tests. That would increase subprocess coverage but make failures slower and less
diagnostic.

## Risks / Trade-offs

- Coverage fixtures can become stale when upstream references change -> include
  source commit and source file in the fixture and update it as part of template
  refresh work.
- Human-curated coverage points are subjective -> write them as concrete
  obligations, constraints, and output-format expectations instead of broad
  quality opinions.
- Longer prompts may cost more context when invoked -> preserve necessary detail
  without adding unrelated explanation or project-specific noise.
- Codex tool availability can vary by session -> phrase tool substitutions as
  available-capability guidance and require agents to state limitations when a
  requested tool is unavailable.
