## Context

Codex Orchestrator ships both a Node installer CLI and an `install-subagents`
skill. The CLI is intentionally configuration-driven and non-interactive: it
discovers config, resolves a target directory, plans writes/removals, and applies
them unless `--dry-run` is passed. That is useful for automation, but unsafe for
agent-driven installs because matching TOML files can be overwritten or removed
without the user seeing the resolved target, models, or file operations first.

The safer boundary is the skill workflow. The agent can inspect the current
workspace, present choices in natural language, run the existing dry-run command,
and ask for final confirmation before invoking the non-dry-run command.

## Goals / Non-Goals

**Goals:**

- Make agent-driven subagent installation require an explicit user interview.
- Surface config source, target directory, existing file, model, and removal
  decisions before installation.
- Require a dry-run summary and final user approval before any write/removal.
- Preserve the existing installer CLI contract for scripted usage.

**Non-Goals:**

- Add a fully interactive CLI prompt flow.
- Change config precedence, target directory defaults, model validation, or
  reasoning effort semantics.
- Add backup, diff, or provenance detection for existing TOML files in this
  change.

## Decisions

1. Put the mandatory interview in `install-subagents/SKILL.md`.

   The immediate failure mode is agent behavior: agents follow the skill and can
   ask questions, while the installer remains a predictable CLI for automation.
   A CLI-level interactive mode would be larger, harder to test portably, and
   would still not cover agents that choose arguments without explaining them.

2. Use the current `--dry-run` output as the final plan source.

   The dry-run already uses the real config merge, template list, target
   resolution, and removal planning path. Requiring agents to run it avoids a
   second hand-rolled planner in the skill and makes the final summary match the
   command that will execute.

3. Treat existing matching files conservatively in the skill.

   If a target TOML path already exists, the agent must identify that the
   non-dry-run install will overwrite it and ask whether to overwrite, preserve,
   or change target/config. The current CLI cannot selectively skip one planned
   write, so preserving an existing file means adjusting the plan before install,
   such as choosing a different target directory or not running the install.

4. Treat disabled matching files as deletion decisions.

   Existing behavior removes disabled bundled output files. The skill must
   surface each planned removal and ask for confirmation because a user may have
   customized a same-named file.

5. Default reasoning effort to existing config behavior.

   The user identified model choice as important and reasoning effort as less
   central. The interview should include model choices per agent and mention
   reasoning effort only as an optional override; omitted values should continue
   to rely on existing defaults/inheritance.

## Risks / Trade-offs

- Skill-only enforcement can be bypassed by running the CLI directly. →
  Mitigate by documenting the CLI as non-interactive and keeping `--dry-run`
  guidance prominent for manual users.
- Agents may summarize dry-run output incorrectly. → Mitigate by requiring the
  summary to list resolved config, target directory, model choices, writes,
  overwrites, removals, and preserved files before asking for confirmation.
- The current CLI lacks selective write/remove controls. → Mitigate by making
  the skill ask the user to adjust config/target or stop rather than pretending
  selective preservation is available.
- Requiring confirmation adds friction for quick installs. → Mitigate by keeping
  the interview concise and allowing the user to approve the full plan once the
  dry-run summary is shown.
