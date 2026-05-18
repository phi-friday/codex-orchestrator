## Context

The installer lives in a Node-compatible `.mjs` script and is currently tested
mostly by spawning the CLI through Node. That coverage is important because the
documented user path is `node plugins/codex-orchestrator/scripts/install-subagents.mjs`,
but it makes focused validation of option parsing, config merging, target
resolution, and template rendering harder than necessary.

The script currently executes `main()` at module evaluation time. That prevents
tests from importing internal functions directly because an import would also
parse process arguments, inspect config files, and potentially write output.
The script also uses `import.meta.dirname`, which is only available in newer
Node 20 patch releases.

## Goals / Non-Goals

**Goals:**

- Allow focused tests to import installer utilities directly.
- Ensure importing the installer module does not execute the CLI flow.
- Preserve the documented Node CLI behavior and existing integration tests.
- Use ES module path handling compatible with the full Node 20 line.

**Non-Goals:**

- Convert the installer implementation from `.mjs` to TypeScript.
- Change CLI options, config precedence, template rendering, or install output.
- Replace the Node subprocess tests with module-only tests.
- Add new runtime dependencies.

## Decisions

- Export the utility functions from the existing `.mjs` installer module.
  - Rationale: The script is already the source of truth for installer behavior,
    and exporting functions avoids duplicating logic in a separate helper module.
  - Alternative considered: Move utilities into a new module and leave the CLI
    file as a thin wrapper. That is a reasonable future split, but it adds file
    churn without reducing much complexity for this small script.

- Guard CLI execution with an ES module entrypoint check.
  - Rationale: `main()` should run only when Node executes the script directly,
    not when Bun tests import it.
  - Alternative considered: Gate execution on an environment variable in tests.
    That would hide the import side effect during tests but leave the module
    unsafe for normal import use.

- Use `fileURLToPath(import.meta.url)` and `path.dirname()` for module path
  constants.
  - Rationale: This pattern is available across Node 20 and handles URL decoding
    and platform path conversion correctly.
  - Alternative considered: Use `import.meta.filename` and `import.meta.dirname`.
    They are concise, but they are not available across the whole Node 20 line.

- Keep CLI tests and add focused utility tests in the same Bun test file unless
  the file becomes difficult to scan.
  - Rationale: The current test suite is small, and colocating the tests keeps
    installer coverage easy to discover.
  - Alternative considered: Create a separate `install-subagents.unit.test.ts`.
    That may become useful if focused tests grow substantially.

## Risks / Trade-offs

- Exporting internal helpers can make implementation details look like public
  API. -> Mitigation: Treat the exports as testable module surface for this
  plugin script, not as documented end-user API.
- Entrypoint detection can be brittle around symlinks or unusual invocation
  paths. -> Mitigation: Resolve `process.argv[1]` before converting it to a file
  URL, and keep the existing direct Node subprocess tests.
- Module-level stdout/stderr helpers are still side-effectful when called
  directly. -> Mitigation: Focus exports and tests on deterministic utility
  behavior; keep CLI output behavior covered through subprocess tests.
