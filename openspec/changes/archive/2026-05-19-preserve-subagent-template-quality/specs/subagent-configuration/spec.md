## ADDED Requirements

### Requirement: Bundled templates preserve source prompt quality
Each bundled Codex custom agent template derived from a reference agent SHALL
preserve the reference prompt's role definition, behavioral guidance,
constraints, output expectations, and specialized operating nuance unless a
specific source instruction is incompatible with Codex.

#### Scenario: Reference obligations remain present
- **WHEN** a bundled template identifies a source agent file in its provenance
  comments
- **THEN** the template's `developer_instructions` preserve the source prompt's
  material role, behavior, constraint, and output obligations in Codex-compatible
  wording

#### Scenario: Templates are not reduced to generic summaries
- **WHEN** a source prompt contains specialized guidance, concrete constraints,
  or a structured output contract
- **THEN** the bundled template retains equivalent guidance, constraints, or
  output structure instead of replacing them with only a brief role summary

### Requirement: Codex adaptations are explicit and justified
Each bundled template SHALL make intentional Codex-specific adaptations
reviewable when source prompt details cannot be carried over directly.

#### Scenario: Incompatible tool names are translated
- **WHEN** a source prompt depends on OpenCode-specific tools, MCP names, or
  runtime behavior that Codex does not provide
- **THEN** the bundled template replaces those details with Codex-available
  capabilities or states that the capability must be used only when configured
  and available

#### Scenario: Material omissions are documented
- **WHEN** a source prompt obligation is intentionally omitted because Codex has
  no equivalent capability or because the instruction would be false in Codex
- **THEN** the bundled template or its quality fixture records the omission and
  the reason

### Requirement: Template quality is verified against source references
The repository SHALL include deterministic verification for bundled subagent
template quality against the referenced source prompts.

#### Scenario: Coverage fixture validates semantic obligations
- **WHEN** the template quality tests run
- **THEN** they verify each bundled template against curated coverage points for
  the referenced source agent's role, behavior, constraints, output format, and
  required Codex adaptation notes

#### Scenario: Excessive compression is detected
- **WHEN** a bundled template removes required source obligations without a
  documented Codex incompatibility
- **THEN** the quality verification fails
