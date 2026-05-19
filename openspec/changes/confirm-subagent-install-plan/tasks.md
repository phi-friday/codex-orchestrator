## 1. Skill Workflow

- [ ] 1.1 Update `plugins/codex-orchestrator/skills/install-subagents/SKILL.md` to require a pre-install interview for config source, target directory, existing matching files, enabled agents, disabled agents, and per-agent model choices.
- [ ] 1.2 Document that reasoning effort is optional during the interview and should use existing config inheritance or omitted values unless the user explicitly asks for overrides.
- [ ] 1.3 Add conservative guidance for existing target files: identify overwrites, explain that the current CLI cannot selectively skip a planned write, and adjust the plan or stop if the user does not approve.
- [ ] 1.4 Add conservative guidance for disabled bundled agents: identify planned removals and adjust the plan or stop if the user does not approve.

## 2. Dry-Run and Confirmation

- [ ] 2.1 Require the agent to run the installer with `--dry-run` after selecting config and target choices.
- [ ] 2.2 Require the agent to summarize resolved config source, target directory, enabled agents, disabled agents, planned writes, planned overwrites, planned removals, and preserved files.
- [ ] 2.3 Require final user confirmation before running the matching non-dry-run installer command.
- [ ] 2.4 Document that the agent must not run the non-dry-run installer when the user rejects, changes, or does not confirm the dry-run summary.

## 3. Tests and Verification

- [ ] 3.1 Add or update tests that guard the install-subagents skill documentation for interview, dry-run review, overwrite/removal callouts, and final confirmation requirements.
- [ ] 3.2 Run `bun run test`.
- [ ] 3.3 Run `bun run typecheck`.
- [ ] 3.4 Run `bun run lint`.
