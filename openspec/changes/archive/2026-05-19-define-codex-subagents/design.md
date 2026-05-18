## Context

Codex Orchestrator currently ships two bundled YAML subagent templates:
`codebase-explorer` and `implementation-worker`. Those files are useful for
installer tests, but they are not the intended agent set and do not follow the
current Codex custom agent format. Codex custom agents are standalone TOML
files with required `name`, `description`, and `developer_instructions` fields,
plus optional session config keys such as `model`, `model_reasoning_effort`,
`sandbox_mode`, `mcp_servers`, and `skills.config`.

The OpenCode reference implementation has useful specialist roles for
`designer`, `explorer`, `fixer`, `librarian`, `observer`, and `oracle`, but its
prompts assume OpenCode-specific tools and MCP names. The bundled Codex agents
need to preserve the role intent while using Codex-supported concepts.

## Goals / Non-Goals

**Goals:**

- Replace placeholder YAML templates with six Codex TOML custom agent templates.
- Avoid the built-in Codex `explorer` name by using `orchestrator-explorer`.
- Keep model selection configuration-driven through `{{MODEL}}` replacement.
- Set `model_reasoning_effort` directly in each template for now.
- Make `librarian` self-contained by including a Context7 MCP server
  configuration.
- Include source provenance in each generated TOML template for future upstream
  comparison.
- Translate tool guidance from OpenCode names to Codex capabilities.
- Update installer tests, skill docs, and specs for TOML output.

**Non-Goals:**

- Adding JSON config support for per-agent `model_reasoning_effort`.
- Managing arbitrary user-authored agents outside bundled template names.
- Implementing a general TOML parser dependency.
- Adding or emulating OpenCode-only tools such as `grep_app`.

## Decisions

### Use TOML templates as the bundled source

Bundled templates will be `.toml` files and rendered to `.toml` output files.
The installer will accept `.toml` template files and derive the agent name from
the `name = "..."` field. This aligns the plugin output with Codex custom agent
configuration instead of relying on YAML samples.

Alternative considered: keep YAML templates and only change prompt text. That
would preserve existing tests but continue generating files that do not match
the documented Codex custom agent format.

### Replace dummy agents with six orchestrator roles

The bundled template set will be:

- `designer`
- `orchestrator-explorer`
- `fixer`
- `librarian`
- `observer`
- `oracle`

`orchestrator-explorer` avoids shadowing Codex's built-in `explorer` agent while
still expressing the OpenCode reference role.

Alternative considered: use `explorer` and rely on Codex custom agents taking
precedence over built-ins. That is supported, but the resulting behavior is less
obvious for users and can make troubleshooting harder.

### Translate tool assumptions into Codex capability guidance

The templates will not claim unavailable OpenCode tools. Tool guidance will be
written in terms of Codex-accessible capabilities:

- Text and file discovery: prefer shell search such as `rg` and `rg --files`.
- Structural search: use only when such tools are configured or available.
- External documentation: use configured MCP servers and web search when
  available.
- GitHub/code search: use configured GitHub/code-search tools when available;
  otherwise report the limitation instead of inventing results.
- Visual analysis: use available vision, file extraction, OCR, or PDF tooling;
  state limitations when the media cannot be inspected.

Alternative considered: remove all tool guidance. That would avoid false tool
claims but lose useful operational direction for each specialist.

### Make Context7 part of the librarian template

The `librarian` template will include:

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
```

This makes the documentation research role useful without requiring separate
user configuration, while still allowing Codex runtime policy and parent config
to apply normally.

Alternative considered: rely on parent/session MCP inheritance. That is lighter
but makes the bundled agent less portable and contradicts the goal of a
self-contained librarian.

### Fix reasoning effort in templates for now

Each template will set `model_reasoning_effort` directly. Suggested defaults:

- `designer`: `medium`
- `orchestrator-explorer`: `medium`
- `fixer`: `medium`
- `librarian`: `medium`
- `observer`: `medium`
- `oracle`: `high`

Alternative considered: extend `codex-orchestrator.json` to configure
reasoning effort per agent. That is useful, but it adds config merge and
validation behavior that should be handled in a later change.

### Record reference provenance as TOML comments

Each bundled template will start with TOML comments identifying the upstream
reference:

```toml
# Derived from oh-my-opencode-slim 1.1.1
# Source repository: https://github.com/alvinunreal/oh-my-opencode-slim
# Source commit: f6b3990de1551b101416154812508e64e2f2d0ca
# Source file: src/agents/designer.ts
# Adaptation: OpenCode-specific tools and permissions translated for Codex custom agents.
```

Use comments rather than custom TOML metadata fields so the generated files stay
within Codex's supported custom agent configuration surface. The source file
line changes per role:

- `designer`: `src/agents/designer.ts`
- `orchestrator-explorer`: `src/agents/explorer.ts`
- `fixer`: `src/agents/fixer.ts`
- `librarian`: `src/agents/librarian.ts`
- `observer`: `src/agents/observer.ts`
- `oracle`: `src/agents/oracle.ts`

Alternative considered: add a `[codex_orchestrator.source]` metadata table.
That would be easier to parse later but risks depending on Codex behavior for
unknown config keys.

## Risks / Trade-offs

- TOML name parsing with a regular expression can miss unusual formatting ->
  Keep generated templates simple and test the supported `name = "..."` form.
- Self-contained Context7 may duplicate a parent MCP definition -> Codex config
  layering should tolerate agent-local config; document that users can edit
  generated TOML if needed.
- Fixed reasoning effort is less flexible -> Keep the JSON config shape focused
  on `model` now and defer per-agent effort configuration to a future spec.
- Provenance comments can become stale when the reference snapshot changes ->
  Treat the source version, commit, and file path as part of the template update
  checklist.
