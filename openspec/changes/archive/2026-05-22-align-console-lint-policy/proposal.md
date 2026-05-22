## Why

The repository currently treats `console` output as intentionally valid for plugin scripts, but the lint configuration still encourages low-level direct stdout and stderr writes outside hook protocol boundaries. This includes `process.stdout.write` / `process.stderr.write`, imported `stdout.write` / `stderr.write` stream calls, and fd-based writes such as `writeSync(1, ...)` / `writeSync(2, ...)`. This change aligns lint policy with the repository's CLI-first codebase while preserving stricter protection for hook stdout contracts.

## What Changes

- Set the global `eslint/no-console` policy to `off` so ordinary scripts can use explicit console methods instead of stream writes.
- Re-enable `eslint/no-console` as `error` for Codex hook code paths where stdout is a machine-readable protocol channel.
- Treat existing non-hook direct stdout and stderr writes as an anti-pattern for user-facing CLI output, including stream writes and fd-based `writeSync(1, ...)` / `writeSync(2, ...)` helpers.
- Replace non-hook stream writes with explicit console severity methods such as `console.info`, `console.error`, `console.warn`, or `console.debug`.
- Avoid `console.log`; new or migrated user-facing output must use a more specific console method.
- Preserve direct stream writes for hook protocol responses and hook diagnostic stderr where stream-level output is intentional.

## Capabilities

### New Capabilities

- `console-output-policy`: Defines lint and output-channel requirements for console usage, stream writes, hook protocol output, and CLI severity methods.

### Modified Capabilities

- `test-execution`: Verification requirements expand to cover the console output lint policy and hook-specific safeguards.

## Impact

- Affects `oxlint.config.ts` rule defaults and overrides.
- Affects Node CLI scripts under `scripts/` and `plugins/codex-orchestrator/scripts/` that currently use direct stdout or stderr writes.
- Affects hook lint policy under `plugins/codex-orchestrator/hooks/` while preserving protocol-oriented stream writes in hook entrypoints.
- Adds or updates regression coverage for global console allowance, hook console prohibition, and replacement of non-hook stream writes.
