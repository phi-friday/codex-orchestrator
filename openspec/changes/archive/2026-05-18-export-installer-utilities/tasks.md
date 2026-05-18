## 1. Test Coverage

- [x] 1.1 Import installer utility functions in the Bun test suite without
  triggering CLI execution.
- [x] 1.2 Add focused tests for option parsing, including explicit config target
  validation and path expansion behavior.
- [x] 1.3 Add focused tests for config agent merging, including inherited fields,
  `null` disabling, and invalid model values.
- [x] 1.4 Add focused tests for target directory resolution across explicit,
  repository, and global config sources.
- [x] 1.5 Add focused tests for template reading and `{{MODEL}}` rendering.

## 2. Installer Module

- [x] 2.1 Replace `import.meta.dirname` path derivation with a
  `fileURLToPath(import.meta.url)` and `dirname()` based pattern.
- [x] 2.2 Add an ES module entrypoint guard so `main()` runs only for direct Node
  script execution.
- [x] 2.3 Export the installer utilities required by the focused tests while
  preserving existing CLI behavior.

## 3. Verification

- [x] 3.1 Run `bun run test` and confirm both focused utility tests and existing
  Node subprocess tests pass.
- [x] 3.2 Run `bun run typecheck`.
- [x] 3.3 Run `bun run lint`.
