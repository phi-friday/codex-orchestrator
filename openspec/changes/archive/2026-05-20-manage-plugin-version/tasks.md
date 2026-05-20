## 1. Documentation Templates

- [x] 1.1 Create `docs/templates/README.md` from the current English README and replace version-specific install refs with `v{{VERSION}}`.
- [x] 1.2 Create `docs/templates/README.kr.md` from the current Korean README and replace version-specific install refs with `v{{VERSION}}`.
- [x] 1.3 Regenerate root `README.md` and `README.kr.md` from the templates using the current `plugin.json.version`.

## 2. Version Script

- [x] 2.1 Add `scripts/version.ts` with importable utilities for reading plugin metadata, validating stable semver, computing `major`/`minor`/`patch`/exact target versions, and rendering README templates.
- [x] 2.2 Implement the bump CLI so `bun run version patch`, `bun run version minor`, `bun run version major`, and `bun run version 0.2.0` update `plugin.json` and regenerate README files.
- [x] 2.3 Implement `--check` mode so it compares generated README content with committed root README files without modifying files.
- [x] 2.4 Implement rollback handling so failures after partial writes restore `plugin.json`, `README.md`, and `README.kr.md` to their original contents.
- [x] 2.5 Add `version` and `version:check` scripts to `package.json` without adding or maintaining `package.json.version`.

## 3. Tests

- [x] 3.1 Add unit tests for stable semver parsing, invalid version rejection, exact version targets, and `major`/`minor`/`patch` increments.
- [x] 3.2 Add tests that render both README templates and verify generated install examples use `--ref v<version>` rather than `--ref main`.
- [x] 3.3 Add tests for `--check` success and drift failure without modifying files.
- [x] 3.4 Add tests proving bump failures roll back `plugin.json`, `README.md`, and `README.kr.md`.
- [x] 3.5 Add CLI subprocess coverage for the documented `bun run version ...` and `bun run version:check` paths where practical.

## 4. Verification

- [x] 4.1 Run `bun run version:check`.
- [x] 4.2 Run `bun run test`.
- [x] 4.3 Run `bun run typecheck`.
- [x] 4.4 Run `bun run lint`.
