## Context

This repository is primarily a Codex plugin package with Node-based scripts, installers, and hooks. The repository guidance already states that `console` is intentionally allowed in plugin scripts and OXC config files, but the current lint shape pushes some ordinary CLI output toward `process.stdout.write` and `process.stderr.write`.

The important distinction is output ownership:

- CLI scripts write human-facing status, usage, and error messages.
- Codex hook entrypoints write machine-readable hook responses to stdout, where accidental console output can corrupt the protocol.

## Goals / Non-Goals

**Goals:**

- Make `console` usage globally allowed so ordinary Node scripts can use readable severity-specific output APIs.
- Keep hook code strict by enabling `eslint/no-console` as `error` for hook paths.
- Migrate non-hook stream writes to explicit console severity methods.
- Ban `console.log` by convention for migrated and new output, using `console.info`, `console.error`, `console.warn`, or `console.debug` instead.
- Preserve direct stream writes where stdout or stderr is part of a machine-readable hook protocol.

**Non-Goals:**

- Do not introduce a logging framework or new runtime dependency.
- Do not redesign CLI output formatting.
- Do not change hook response schemas or hook enforcement behavior.
- Do not modify vendored reference snapshots under ignored reference paths.

## Decisions

1. Global `eslint/no-console` defaults to `off`.

   This matches the repository's CLI/plugin-script orientation and avoids forcing user-facing output through low-level streams. The alternative, keeping `no-console` broadly enabled and adding many overrides, makes the exception the practical default and obscures the actual policy.

2. Hook paths re-enable `eslint/no-console` as `error`.

   Hook stdout is consumed by Codex as a response channel, so accidental console output has a higher blast radius than ordinary CLI logging. The hook override turns the lint rule into a protocol safeguard rather than a general style preference.

3. Non-hook `process.stdout.write` and `process.stderr.write` are treated as an anti-pattern for CLI messages.

   For human-facing script output, console severity methods communicate intent better and handle newline behavior consistently. Existing non-hook stream writes should be replaced with specific methods: `console.info` for normal status and usage output, `console.error` for errors, `console.warn` for warnings, and `console.debug` for diagnostic detail.

4. `console.log` is not used for migrated or new output.

   Although global console usage is allowed, `console.log` is too generic for the desired style. The implementation should prefer severity-specific methods so output intent is visible at the call site.

5. Hook stream writes remain valid.

   The hook entrypoint may keep direct stdout writes for JSON protocol responses and direct stderr writes for fatal diagnostics. These are not user-facing CLI messages and should not be migrated to console methods.

## Risks / Trade-offs

- Hook override scope too broad -> tests or helper files under hook paths may reject temporary debug console calls. Mitigation: keep hook code console-free and rely on tests/assertions rather than debug prints.
- Global console allowance may permit accidental `console.log` in ordinary scripts. Mitigation: document `console.log` as disallowed by policy and add targeted lint or tests if oxlint supports a precise rule for method-specific console calls.
- Replacing stream writes can change exact newline behavior. Mitigation: preserve visible output semantics in tests and check command output where covered.
- `console.info` output goes to stdout in Node, while `console.error` output goes to stderr. Mitigation: map existing stdout writes to `console.info` and stderr writes to `console.error` unless the message is clearly a warning or diagnostic.
