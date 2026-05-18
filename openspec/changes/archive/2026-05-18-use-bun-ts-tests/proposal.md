## Why

The installer tests are currently written as JavaScript and run through Node's
built-in test runner, while the repository already uses Bun for dependency
management and verification. Moving tests to TypeScript on Bun aligns test
authoring with the rest of the repo's TypeScript checks without changing the
installer's Node runtime contract.

## What Changes

- Convert installer tests from `.mjs` JavaScript to `.test.ts` TypeScript.
- Run tests with `bun test` via a package script.
- Use Bun's test APIs for test definitions and assertions.
- Keep installer subprocess coverage pointed at the Node CLI entrypoint so the
  Node-supported installer behavior remains verified.

## Capabilities

### New Capabilities

- `test-execution`: Defines how repository tests are authored and executed.

### Modified Capabilities

- None.

## Impact

- Affects `package.json` scripts.
- Affects installer test files under `plugins/codex-orchestrator/scripts/`.
- Does not change the installer CLI interface or bundled subagent output.
