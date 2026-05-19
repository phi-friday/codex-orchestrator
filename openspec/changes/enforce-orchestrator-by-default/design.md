## Context

The plugin currently exposes `codex-orchestrator` as a static skill plus bundled
custom subagents installed by a separate script. The skill already describes
delegation economics, specialist routing, parent-owned integration, and
verification, but it is easy for an agent to skip the skill unless the user
explicitly invokes `$codex-orchestrator`.

Codex plugin hooks provide a runtime mechanism for adding context to prompts and
continuing turns, but plugin hooks require Codex plugin hook support to be
enabled in the user's environment. Hooks also cannot guarantee tool choices; they
can only provide extra context, block or continue certain lifecycle events, and
surface warnings. The design therefore treats hooks as a strong nudge and
continuation guard, while the skill description remains the first line of
selection pressure.

## Goals / Non-Goals

**Goals:**

- Make orchestration the default for applicable coding-agent work unless the
  user explicitly opts out.
- Improve skill discovery by expanding the skill description with strong trigger
  language.
- Bundle plugin hooks that inject concise orchestration guidance on relevant
  user prompts.
- Keep hook logic deterministic, testable, and conservative around explicit
  opt-out language.
- Preserve parent-owned integration and verification as the completion standard.

**Non-Goals:**

- Do not force subagent usage when the user explicitly asks not to use
  orchestration, subagents, delegation, or agents.
- Do not implement a custom Codex runtime or replace built-in subagent tooling.
- Do not require hooks for the skill to remain usable; hooks are an additional
  runtime layer.
- Do not auto-install or mutate user-level Codex config outside this repository.

## Decisions

### Strengthen skill selection in frontmatter

The `description` field should explicitly say the skill must be used by default
for substantive coding-agent work, including implementation, debugging, review,
research, verification, multi-file edits, and multi-step tasks. This increases
selection pressure before runtime hooks are considered.

Alternative considered: only add hook behavior. That would miss sessions where
plugin hooks are disabled or unsupported, so frontmatter remains necessary.

### Add plugin hooks as bundled lifecycle context

The plugin should add `plugins/codex-orchestrator/hooks/hooks.json` and register
it from `.codex-plugin/plugin.json`. The initial hook should target
`UserPromptSubmit` because that event can add developer context before the
assistant plans or acts.

Alternative considered: use only `Stop` hooks. Stop hooks can catch premature
completion, but they are later in the turn and cannot shape the initial plan as
effectively.

### Implement hook logic in an importable Node module

Hook scripts should use Node.js runtime semantics and expose importable decision
helpers for tests. A thin CLI wrapper can read hook JSON from stdin, call the
helper, and print either no output or JSON with `additionalContext`.

Alternative considered: write a shell-only hook. Shell logic would be harder to
test and less maintainable for prompt classification and opt-out detection.

### Use heuristic applicability and explicit opt-out detection

The hook should inject orchestration context when the user prompt appears to ask
for coding-agent work or repository work. It must suppress injection when the
prompt explicitly says not to use orchestration, subagents, delegation, spawned
agents, or the orchestrator skill.

Alternative considered: inject on every user prompt. That would be closer to
"always", but it would degrade simple questions and violate explicit opt-out
requests more easily.

### Keep Stop hook optional and narrow

If implemented, a `Stop` hook should only continue the turn when the final
assistant response appears to claim completion for applicable work while missing
orchestration/verification language. It should avoid loops by respecting the
`stop_hook_active` field.

Alternative considered: always continue applicable work until orchestration is
mentioned. That risks frustrating users and creating unnecessary extra turns.

## Risks / Trade-offs

- Plugin hooks may be disabled in Codex → Document the `[features].plugin_hooks =
  true` requirement and rely on strengthened skill description as the fallback.
- Heuristic prompt classification can over-trigger → Include opt-out detection,
  concise injected context, and tests for simple/non-coding prompts.
- Heuristic prompt classification can under-trigger → Bias toward triggering on
  repository, implementation, debugging, testing, review, and investigation
  language.
- Hooks cannot force a subagent tool call → Phrase behavior as mandatory
  developer context, but keep the implementation aligned with Codex hook
  capabilities.
- Aggressive continuation can be noisy → Keep any Stop hook scoped, loop-safe,
  and tested.
