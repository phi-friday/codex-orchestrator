## 1. Regression Coverage

- [ ] 1.1 Add or update lint policy tests that assert `eslint/no-console` is globally off for non-hook script paths.
- [ ] 1.2 Add or update lint policy tests that assert hook paths enforce `eslint/no-console` as an error.
- [ ] 1.3 Add or update repository tests that fail when non-hook project scripts use `process.stdout.write` or `process.stderr.write` for user-facing output.
- [ ] 1.4 Add or update repository tests that fail when project code uses `console.log`.

## 2. Lint Configuration

- [ ] 2.1 Remove obsolete `eslint/no-console` override entries that only exist to permit ordinary script output.
- [ ] 2.2 Configure `eslint/no-console` as globally off in `oxlint.config.ts`.
- [ ] 2.3 Add a hook-path override that configures `eslint/no-console` as an error for `plugins/codex-orchestrator/hooks/**`.

## 3. Output Migration

- [ ] 3.1 Replace non-hook `process.stdout.write` calls in project scripts with `console.info` where they emit normal status or usage output.
- [ ] 3.2 Replace non-hook `process.stderr.write` calls in project scripts with `console.error`, `console.warn`, or `console.debug` based on message intent.
- [ ] 3.3 Preserve direct stdout and stderr stream writes in hook entrypoints where they implement protocol response or fatal diagnostic channels.
- [ ] 3.4 Ensure migrated output does not use `console.log`.

## 4. Verification

- [ ] 4.1 Run `bun run test`.
- [ ] 4.2 Run `bun run typecheck`.
- [ ] 4.3 Run `bun run lint`.
- [ ] 4.4 Run `bun run version:check`.
