## Context

The repository is a Codex plugin bundle, not a conventional npm package. The
plugin's meaningful release version already lives in
`plugins/codex-orchestrator/.codex-plugin/plugin.json`, while `package.json`
currently has no top-level `version` field and is mainly used for local scripts,
dependency metadata, and reference snapshot configuration.

The root README files currently document marketplace installation with
`--ref main`. That points users at a moving branch instead of a concrete plugin
version. The English and Korean README files also need to stay aligned when the
documented install ref changes.

## Goals / Non-Goals

**Goals:**

- Treat `plugin.json.version` as the single source of truth for the plugin
  version.
- Provide a simple bump command with positional arguments:
  `bun run version patch`, `bun run version minor`, `bun run version major`, and
  `bun run version 0.2.0`.
- Provide `bun run version:check` to detect generated README drift without
  modifying files.
- Store README source templates in `docs/templates/`.
- Render `README.md` and `README.kr.md` by replacing `{{VERSION}}` with the
  plugin version.
- Pin generated marketplace install examples to `v{{VERSION}}`.
- Roll back all touched files if the bump operation fails.

**Non-Goals:**

- Do not add or maintain `package.json.version`.
- Do not create git tags, commits, releases, or changelog entries.
- Do not introduce an npm semver dependency for this small script.
- Do not template unrelated plugin runtime assets.

## Decisions

1. **Use `plugin.json.version` as the only version source.**

   `package.json.version` would imply npm package release semantics that this
   repository does not currently use. Keeping the version in plugin metadata
   matches the artifact users install and avoids synchronizing two version
   fields.

   Alternative considered: add `package.json.version` and enforce equality with
   `plugin.json.version`. This was rejected because it introduces a second
   version field solely to validate it against the first.

2. **Use `docs/templates/` for README templates.**

   The existing `plugins/codex-orchestrator/assets/` directory contains plugin
   runtime assets such as schemas and bundled subagent TOML templates. README
   templates are repository documentation source files, so `docs/templates/`
   makes their purpose clearer and keeps them out of the plugin runtime bundle.

   Alternative considered: root `assets/readme/`. This is workable, but less
   explicit about documentation ownership.

3. **Expose `version` and `version:check` package scripts.**

   The bump UX should be short and natural:

   ```bash
   bun run version patch
   bun run version minor
   bun run version major
   bun run version 0.2.0
   ```

   The check script can remain explicit internally:

   ```json
   {
     "version": "bun scripts/version.ts",
     "version:check": "bun scripts/version.ts --check"
   }
   ```

   Alternative considered: requiring `bun run version -- patch`. This was
   rejected because Bun can pass positional script arguments without the extra
   separator, and the shorter command is easier to use.

4. **Render README files by strict placeholder replacement.**

   Each template must contain `{{VERSION}}`. The script renders the root README
   files by replacing every `{{VERSION}}` occurrence with the exact
   `plugin.json.version`. The generated installation examples should use
   `--ref v{{VERSION}}` in templates, producing refs such as `--ref v0.1.0`.

   This keeps the template mechanism intentionally small and testable.

5. **Make bump writes rollback-safe.**

   The bump command touches at least:

   - `plugins/codex-orchestrator/.codex-plugin/plugin.json`
   - `README.md`
   - `README.kr.md`

   Before writing, the script should read and retain the original contents of
   all touched files. If parsing, validation, rendering, or writing fails after
   any touched file has changed, it should restore the original contents and
   return a failing exit code.

## Risks / Trade-offs

- Drift between templates and generated README files -> `version:check` compares
  generated output to the committed root README files and fails on mismatch.
- Template placeholder is missing or misspelled -> rendering fails before
  overwriting generated README files.
- Rollback fails after a partial write -> tests should cover the intended
  rollback path, and the command should report both the original failure and any
  restore failure clearly.
- Manual edits to root README files can be overwritten by bumping -> root README
  files become generated outputs; durable documentation edits belong in
  `docs/templates/`.
- Hand-rolled semver parsing can be incomplete -> support only stable
  `MAJOR.MINOR.PATCH` versions for this plugin and reject prerelease/build
  metadata unless a future change expands the contract.
