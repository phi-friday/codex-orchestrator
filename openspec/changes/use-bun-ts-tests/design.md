## Context

The repository packages a Codex Orchestrator plugin and uses Bun for local
dependency management plus TypeScript, lint, and formatting verification. The
installer itself is a Node-compatible `.mjs` script, but its tests are currently
JavaScript files using `node:test`.

This change updates the test authoring and runner layer while preserving the
installer's Node runtime expectations.

## Goals / Non-Goals

**Goals:**

- Author installer tests in TypeScript.
- Execute repository tests through Bun using a package script.
- Keep test coverage for the Node CLI invocation path.
- Preserve existing installer behavior and configuration semantics.

**Non-Goals:**

- Convert the installer implementation from `.mjs` to TypeScript.
- Require Bun as the runtime for end users invoking the installer.
- Change installer options, config precedence, output paths, or template
  rendering behavior.

## Decisions

- Use `bun:test` for test definitions and assertions.
  - Rationale: Bun is already the repository's local toolchain, and using its
    test API allows `.test.ts` files to run without a separate transpilation
    step.
  - Alternative considered: keep `node:test` in TypeScript. That would preserve
    Node test semantics but would still need an execution strategy for TypeScript
    tests, which adds tooling this repo does not otherwise need.

- Add a `test` package script that runs `bun test`.
  - Rationale: This matches the existing `bun run typecheck`, `bun run lint`,
    and `bun run format` workflow style and gives agents a stable verification
    command.
  - Alternative considered: document direct `bun test` usage only. A package
    script is easier to discover and keeps command guidance consistent.

- Continue executing the installer subprocess through Node from tests.
  - Rationale: Repository guidance says plugin helper scripts should assume
    Node.js runtime semantics, and documented installer usage invokes the
    `.mjs` script with Node. Running the subprocess with Bun would leave Node
    compatibility less directly verified.
  - Alternative considered: run the subprocess through Bun. That would prove Bun
    compatibility but weaken coverage of the supported Node CLI path.

## Risks / Trade-offs

- Bun's assertion and test APIs differ from `node:test` and `node:assert`.
  -> Mitigation: Keep assertions simple and focused on the existing observable
  CLI behavior.

- TypeScript strictness may expose fixture typing issues during conversion.
  -> Mitigation: Define small local types for helper return values and caught
  subprocess errors rather than relaxing compiler settings.

- Tests will require Bun in local development.
  -> Mitigation: Bun is already required by repository verification commands and
  dependency management.
