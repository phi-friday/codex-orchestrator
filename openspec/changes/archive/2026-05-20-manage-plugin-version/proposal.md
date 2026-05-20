## Why

Plugin installation documentation currently points users at the moving `main`
ref, while the plugin metadata already has a concrete version in
`plugins/codex-orchestrator/.codex-plugin/plugin.json`. This creates a release
management gap: users cannot easily install a pinned plugin version, and README
version strings can drift from plugin metadata.

## What Changes

- Add a version management command that updates
  `plugins/codex-orchestrator/.codex-plugin/plugin.json` and regenerates root
  README files from templates.
- Add a version check command that fails when generated README files drift from
  the plugin metadata and templates.
- Add README templates under `docs/templates/` using a `{{VERSION}}`
  placeholder.
- Update generated English and Korean README installation examples to pin
  marketplace installs to `v{{VERSION}}` instead of `main`.
- Keep `package.json` out of the plugin version source of truth; do not add or
  maintain `package.json.version` for this plugin.

## Capabilities

### New Capabilities

- `plugin-version-management`: Defines plugin version bumping, README template
  rendering, version drift checking, and rollback behavior.

### Modified Capabilities

- None.

## Impact

- Affects `plugins/codex-orchestrator/.codex-plugin/plugin.json`.
- Adds a version management script under `scripts/`.
- Adds `version` and `version:check` package scripts.
- Adds README templates under `docs/templates/`.
- Regenerates `README.md` and `README.kr.md` from templates.
- Adds tests for version bumping, README rendering, drift detection, exact
  version handling, semver increments, and rollback on failure.
