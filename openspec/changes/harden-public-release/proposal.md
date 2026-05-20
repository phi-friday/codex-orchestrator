## Why

Pre-public-release review found installer, hook, metadata, and release-gate
risks that can break user environments or expose unsafe generated configuration
after the repository is published. The intentionally destructive behavior where
missing or `null` agent models disable and remove managed bundled agents remains
out of scope.

## What Changes

- Escape or validate rendered TOML string values so configured models cannot
  inject arbitrary TOML into generated subagent definitions.
- Add provenance-aware overwrite and removal behavior so the installer does not
  silently replace or delete user-authored agent files that share bundled
  basenames.
- Improve installer failure handling so partial write/remove failures do not
  leave users without clear recovery guidance.
- Quote or otherwise safely invoke hook script paths when plugin roots contain
  spaces.
- Remove stale root package metadata that points to a non-existent runtime
  module.
- Make the `librarian` bundled subagent read-only by default.
- Add release verification coverage for generated docs, public plugin metadata,
  and marketplace install smoke expectations.
- Clarify public documentation around hook enforcement limits and external tool
  requirements.

## Capabilities

### New Capabilities
- `public-release-readiness`: Public release metadata, documentation, and
  verification gates for Codex Orchestrator plugin distribution.

### Modified Capabilities
- `subagent-configuration`: Installer rendering and file mutation behavior must
  be safe for TOML strings and user-owned agent files.
- `orchestrator-hook-enforcement`: Hook command registration must work from
  plugin paths containing spaces and documentation must describe hooks as
  nudges rather than proof of real verification.
- `orchestrator-skill-guidance`: Bundled subagent template permissions must
  match each specialist's default role, including read-only librarian research.
- `plugin-version-management`: Version-generated README verification must remain
  part of the release gate.
- `test-execution`: Release verification must include tests for installer
  safety, hook path safety, generated documentation drift, and public release
  smoke checks.

## Impact

- Affected files include installer scripts and tests, bundled subagent TOML
  templates, hook configuration/tests, package metadata, README templates,
  generated README files, and any added release/CI smoke workflow.
- No npm/yarn/pnpm lockfiles should be added; Bun remains the verification
  runner.
- The empty-config/missing-model behavior that removes managed bundled agent
  outputs is intentionally preserved.
