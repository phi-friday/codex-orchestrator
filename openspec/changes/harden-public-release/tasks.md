## 1. Installer Safety

- [ ] 1.1 Add a TOML string rendering helper for installer template values and use it for configured model output.
- [ ] 1.2 Add tests covering ordinary model values plus quotes, backslashes, newlines, tabs, and control characters.
- [ ] 1.3 Add a stable Codex Orchestrator managed marker to rendered bundled subagent files without treating bundled provenance comments alone as ownership proof.
- [ ] 1.4 Update installer planning to classify writes, managed removals, unmanaged preserves, and blocking conflicts before mutation.
- [ ] 1.5 Make non-dry-run installation abort before writing when an enabled bundled agent would overwrite an unmanaged target file.
- [ ] 1.6 Make disabled bundled agents remove only managed target files and preserve unmanaged files with clear dry-run and non-dry-run output.
- [ ] 1.7 Add installer tests for unmanaged overwrite conflicts, unmanaged disabled-file preservation, managed overwrite, managed removal, provenance-comment-only files, and failed write/remove path reporting.

## 2. Hook And Subagent Template Hardening

- [ ] 2.1 Quote or otherwise safely delimit `${PLUGIN_ROOT}` in bundled hook commands.
- [ ] 2.2 Add hook configuration tests proving UserPromptSubmit and Stop commands safely reference plugin paths with spaces.
- [ ] 2.3 Change the bundled `librarian` custom-agent template to use a read-only filesystem sandbox by default.
- [ ] 2.4 Update librarian prompt guidance so implementation edits discovered during research are routed to the parent or a write-capable role.
- [ ] 2.5 Add template quality tests for librarian read-only sandbox and edit-routing guidance.

## 3. Public Release Readiness

- [ ] 3.1 Remove stale root package runtime metadata that points to non-existent files.
- [ ] 3.2 Add metadata tests that fail when root package runtime entry fields point to missing files.
- [ ] 3.3 Update README templates and generated README files to include `bun run version:check` in pre-release verification.
- [ ] 3.4 Document any external CLI dependency used by documented package scripts, or remove the dependency from the script implementation.
- [ ] 3.5 Clarify README hook notes so Stop hook behavior is described as text-based nudging rather than independent proof of delegation, cleanup, or verification.
- [ ] 3.6 Add a documented marketplace install smoke gate for a fresh Git marketplace source with a pinned ref, skill/hook resolution, and installer dry-run using a test configuration.
- [ ] 3.7 Add CI or a release verification script that runs `bun run test`, `bun run typecheck`, `bun run lint`, and `bun run version:check`.

## 4. Verification

- [ ] 4.1 Run `bun run test` and confirm all release-hardening regression tests pass.
- [ ] 4.2 Run `bun run typecheck` and fix any TypeScript issues.
- [ ] 4.3 Run `bun run lint` and fix any lint issues.
- [ ] 4.4 Run `bun run version:check` and confirm generated README files are in sync.
- [ ] 4.5 Run `node plugins/codex-orchestrator/scripts/install-subagents.mjs --dry-run` against a representative test config and confirm safe planned output.
- [ ] 4.6 Run `openspec validate harden-public-release --strict` and fix any proposal/spec issues.
