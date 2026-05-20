## Context

Codex Orchestrator is being prepared for public release as a plugin repository.
The current verification suite passes, but release review identified risks in
surfaces that affect users after installation: generated TOML, mutation of
custom agent files, hook command invocation, bundled agent permissions, stale
metadata, and release documentation. These risks span installer code, plugin
hooks, templates, generated docs, and verification commands, so they need one
coordinated hardening pass rather than isolated cleanup.

## Goals / Non-Goals

**Goals:**

- Prevent config-provided model strings from changing generated TOML structure.
- Avoid silently overwriting or deleting user-authored custom agent files.
- Preserve the documented ability to disable bundled agents by omitting a model
  or setting `model: null`.
- Make hook commands robust when the plugin path contains spaces.
- Align bundled role permissions with least privilege, especially for
  documentation research.
- Remove stale public metadata and add release verification coverage for docs,
  metadata, and marketplace smoke behavior.
- Clarify documentation where hooks are guidance nudges rather than proof of
  actual test or delegation execution.

**Non-Goals:**

- Do not change the intentional behavior where disabled or missing bundled
  models remove matching managed bundled agent outputs.
- Do not introduce npm, yarn, or pnpm package management artifacts.
- Do not replace the Node `.mjs` installer runtime path.
- Do not add new network-dependent release tests that must pass in every local
  development run unless they are explicitly documented as manual smoke gates.

## Decisions

1. Render TOML strings through a dedicated escaping helper.

   The installer should render configured strings using a single helper that
   produces valid TOML basic-string content for quotes, backslashes, newlines,
   tabs, and control characters. This keeps custom model names possible while
   preventing TOML structure injection. A stricter model-name allowlist was
   considered, but it risks rejecting future model identifiers that Codex may
   support.

2. Use plugin provenance markers before mutating existing agent files.

   Rendered bundled agent files should include a stable Codex Orchestrator
   managed marker. The installer may overwrite or remove files only when the
   existing target file carries that marker, or when the file does not exist.
   Source provenance comments alone should not count as ownership proof because
   a user may copy or adapt a bundled template manually. If a target basename
   exists without the marker, the installer should fail with a clear message
   during non-dry-run and report the conflict during dry-run. Backing up and
   overwriting was considered, but refusing unmarked files better protects
   user-authored custom agents and makes intent explicit.

3. Keep disable/removal semantics but narrow them to managed files.

   Missing, blank, or `null` models continue to mean that the bundled agent is
   disabled. The difference is that removal applies only to files that are known
   to be managed by this plugin. This preserves the intended config contract
   while preventing accidental deletion of unrelated files.

4. Treat installer mutation as a planned operation with explicit conflict and
   error reporting.

   The installer should calculate writes, managed removals, and conflicts before
   mutation. Non-dry-run mode should abort before writing if conflicts exist.
   If a write or removal fails after mutation starts, the command should fail
   with the exact path and leave enough output for manual recovery. Full
   transactional rollback is not required for this release because filesystem
   portability would add complexity, but tests should cover conflict avoidance
   and clear partial-failure errors.

5. Quote hook command paths at registration time.

   Hook commands should invoke Node with a quoted `${PLUGIN_ROOT}` path or an
   equivalent command form accepted by Codex hooks so paths with spaces do not
   split into multiple shell words. Tests should assert the bundled hook config
   contains the safe command form.

6. Make `librarian` read-only by default.

   The librarian role performs external documentation research and may configure
   Context7 MCP. Its default sandbox should be read-only, and any code changes
   discovered from research should be routed to a write-capable role or the
   parent. This reduces the blast radius for a network-enabled research agent.

7. Add a release-readiness layer instead of overloading existing version logic.

   Public release readiness includes package metadata sanity, generated README
   drift checks, CI or scripted verification, and a documented marketplace smoke
   gate. These are broader than version management alone, so they belong in a
   dedicated `public-release-readiness` capability while reusing
   `version:check` as one required gate.

## Risks / Trade-offs

- Existing generated files lack the new managed marker -> First hardened install
  may treat old generated files as unmarked conflicts. Mitigation: document a
  one-time migration path that asks the user to review the file, delete it, or
  opt into replacing it before running the hardened installer again.
- Overly aggressive TOML escaping could change displayed model names ->
  Mitigation: test quotes, backslashes, newlines, and ordinary model IDs against
  expected TOML output.
- Quoting hook commands depends on Codex hook command parsing -> Mitigation:
  keep the command as a single string compatible with current hooks and test the
  JSON value directly; verify manually in a path with spaces before release.
- Marketplace smoke tests may require network and Codex CLI state -> Mitigation:
  keep networked marketplace install as a documented release checklist item if
  it cannot run reliably in local CI.
