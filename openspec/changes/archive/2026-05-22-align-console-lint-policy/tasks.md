## 1. Regression Coverage

- [x] 1.1 Add or update lint policy tests that assert `eslint/no-console` is globally off for non-hook script paths.
- [x] 1.2 Add or update lint policy tests that assert hook paths enforce `eslint/no-console` as an error.
- [x] 1.3 Add or update repository tests that fail when non-hook project scripts use direct stdout or stderr writes for user-facing output, including `process.stdout.write`, `process.stderr.write`, imported `stdout.write` / `stderr.write`, `writeSync(1, ...)`, and `writeSync(2, ...)`.
- [x] 1.4 Add or update repository tests that fail when project code uses `console.log`.

## 2. Lint Configuration

- [x] 2.1 Remove obsolete `eslint/no-console` override entries that only exist to permit ordinary script output.
- [x] 2.2 Configure `eslint/no-console` as globally off in `oxlint.config.ts`.
- [x] 2.3 Add a hook-path override that configures `eslint/no-console` as an error for `plugins/codex-orchestrator/hooks/**`.

## 3. Output Migration

- [x] 3.1 Replace non-hook direct stdout writes in project scripts with `console.info` where they emit normal status or usage output.
- [x] 3.2 Replace non-hook direct stderr writes in project scripts with `console.error`, `console.warn`, or `console.debug` based on message intent.
- [x] 3.3 Preserve direct stdout and stderr stream writes in hook entrypoints where they implement protocol response or fatal diagnostic channels.
- [x] 3.4 Ensure migrated output does not use `console.log`.

## 4. Verification

- [x] 4.1 Run `bun run test`.
- [x] 4.2 Run `bun run typecheck`.
- [x] 4.3 Run `bun run lint`.
- [x] 4.4 Run `bun run version:check`.
