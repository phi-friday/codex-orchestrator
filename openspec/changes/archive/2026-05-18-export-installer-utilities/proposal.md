## Why

The installer script contains option parsing, configuration merging, template
rendering, and target resolution logic that is currently only exercised through
end-to-end CLI tests. Exporting focused utilities and guarding CLI execution
allows these decisions to be tested directly while preserving the documented
Node-based installer entrypoint.

## What Changes

- Export the installer utility functions needed for focused tests.
- Add an ES module main guard so importing the installer module does not execute
  the CLI flow.
- Replace `import.meta.dirname` usage with a Node 20-compatible
  `fileURLToPath(import.meta.url)` pattern.
- Add focused Bun tests for internal installer utilities while keeping the
  existing Node subprocess tests for the CLI path.

## Capabilities

### New Capabilities

- `installer-testable-module`: The installer script can be imported as a module
  for focused utility tests without triggering CLI side effects.

### Modified Capabilities

None.

## Impact

- Affects `plugins/codex-orchestrator/scripts/install-subagents.mjs`.
- Affects `plugins/codex-orchestrator/scripts/install-subagents.test.ts`.
- No CLI option, config format, template format, or generated subagent behavior
  changes are intended.
- No new runtime dependency is expected.
