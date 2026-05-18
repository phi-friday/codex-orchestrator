## 1. Test Coverage

- [ ] 1.1 Import installer utility functions in the Bun test suite without
  triggering CLI execution.
- [ ] 1.2 Add focused tests for option parsing, including explicit config target
  validation and path expansion behavior.
- [ ] 1.3 Add focused tests for config agent merging, including inherited fields,
  `null` disabling, and invalid model values.
- [ ] 1.4 Add focused tests for target directory resolution across explicit,
  repository, and global config sources.
- [ ] 1.5 Add focused tests for template reading and `{{MODEL}}` rendering.

## 2. Installer Module

- [ ] 2.1 Replace `import.meta.dirname` path derivation with a
  `fileURLToPath(import.meta.url)` and `dirname()` based pattern.
- [ ] 2.2 Add an ES module entrypoint guard so `main()` runs only for direct Node
  script execution.
- [ ] 2.3 Export the installer utilities required by the focused tests while
  preserving existing CLI behavior.

## 3. Verification

- [ ] 3.1 Run `bun run test` and confirm both focused utility tests and existing
  Node subprocess tests pass.
- [ ] 3.2 Run `bun run typecheck`.
- [ ] 3.3 Run `bun run lint`.
