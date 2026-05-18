## 1. Test Script Setup

- [ ] 1.1 Add a `test` package script that runs `bun test`.
- [ ] 1.2 Confirm the new test command fits the existing Bun-based verification commands.

## 2. Test Conversion

- [ ] 2.1 Rename the installer test from `.mjs` to `.test.ts`.
- [ ] 2.2 Replace `node:test` and `node:assert/strict` usage with `bun:test` APIs.
- [ ] 2.3 Convert JSDoc typedefs and casts to local TypeScript types.
- [ ] 2.4 Keep installer subprocess execution on the Node executable and the `.mjs` entrypoint.

## 3. Verification

- [ ] 3.1 Run `bun run typecheck` and resolve any TypeScript errors.
- [ ] 3.2 Run `bun run lint` and resolve any lint errors.
- [ ] 3.3 Run `bun run test` and confirm the installer behavior tests pass.
