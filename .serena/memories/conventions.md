# Conventions

- Keep plugin skill/helper changes scoped; do not introduce an app entrypoint just because `package.json` has Bun init leftovers like `module: "index.ts"`.
- Tests are TypeScript `.test.ts` files run by Bun.
- Installer tests should keep Node subprocess coverage for the documented `.mjs` CLI path.
- Importable installer utilities must not trigger CLI side effects on import.
- Test fixtures should use temporary directories and clean up after each test.
- TS naming: PascalCase for types/classes, camelCase for functions, snake_case for locals/state-like bindings, UPPER_CASE for module-level immutable primitive constants, `_` prefix for private/internal or intentionally unused values.
- `console` is intentionally allowed in plugin scripts and OXC config files.