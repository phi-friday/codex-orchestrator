## 1. Skill Guidance

- [ ] 1.1 Reorder `install-subagents/SKILL.md` so the local install wizard is
  presented before direct `install-subagents.mjs` command examples.
- [ ] 1.2 Replace weak "prefer" wording with wizard-first MUST guidance when
  the wizard command is available, suitable, and the user can open the reported
  local URL.
- [ ] 1.3 State that `install-subagents.mjs --dry-run` must wait for
  wizard-submitted answers or a completed fallback chat interview.
- [ ] 1.4 List accepted chat fallback reasons: wizard unavailable, start
  failure, unsuitable local URL environment, user cannot open the URL, user
  declines, non-zero exit, invalid answers, or timeout/no submitted answers.

## 2. Plugin Prompt

- [ ] 2.1 Update `.codex-plugin/plugin.json` default prompt text so use of
  `$install-subagents` includes wizard-first interview guidance.
- [ ] 2.2 Keep the prompt concise and avoid implying that the wizard performs
  config writes, dry-runs, or installation.

## 3. Regression Tests

- [ ] 3.1 Strengthen the install-subagents skill documentation test to assert
  wizard-first MUST wording before direct installer dry-run guidance.
- [ ] 3.2 Add assertions that chat interview fallback is limited to explicit
  wizard failure, unsuitability, decline, invalid answers, or timeout cases.
- [ ] 3.3 Add an assertion that direct installer dry-run happens only after
  wizard answers or completed fallback chat interview.
- [ ] 3.4 Add or update plugin metadata tests if existing coverage checks
  `.codex-plugin/plugin.json` prompt guidance.

## 4. Verification

- [ ] 4.1 Run `bun run test`.
- [ ] 4.2 Run `bun run typecheck`.
- [ ] 4.3 Run `bun run lint`.
- [ ] 4.4 Run `openspec validate prioritize-subagent-install-wizard --strict`.
