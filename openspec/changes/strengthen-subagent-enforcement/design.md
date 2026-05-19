## Context

The current Codex Orchestrator skill says orchestration is mandatory by
default, but it also allows the parent to skip delegation whenever delegation
overhead is greater than or equal to doing the work locally. In practice that
local-only escape hatch is broad enough that routine repository investigation,
review, and summarization can be handled entirely by the parent even when
specialists are available and the user did not opt out.

The hook layer reinforces the workflow by injecting context, but it cannot
force a `spawn_agent` call. The practical enforcement surface is therefore:

- stronger skill instructions that bias the parent toward spawning available
  specialists;
- stronger hook context that says applicable work needs delegation evidence or
  a concrete allowed exception;
- tests that prevent regressions in the injected guidance and stop-time guard.

## Goals / Non-Goals

**Goals:**

- Make available subagents the default execution path for substantive coding
  work, especially repository investigation, review, multi-file analysis,
  implementation slices, and verification lanes.
- Narrow local-only execution to explicit opt-out, unavailable specialists,
  truly trivial commands, or immediate critical-path work that would be delayed
  by waiting for a subagent.
- Require an explicit local-only reason when applicable work completes without
  delegation.
- Preserve parent-owned synthesis, conflict resolution, and verification.

**Non-Goals:**

- Do not build a runtime-level tool-call interceptor that can forcibly invoke
  `spawn_agent`.
- Do not delegate non-coding questions or user-opted-out requests.
- Do not remove the parent's authority over integration and final verification.
- Do not invent specialists that are unavailable in the current Codex runtime.

## Decisions

1. **Change the default from "consider delegation" to "delegate unless an
   allowed exception applies."**

   The skill should still identify the critical path, but for substantive work
   the parent should start from a subagent-first assumption. This makes the
   behavior match the user's expectation: opt-out is the normal way to prevent
   subagent use.

   Alternative considered: keep the current economic wording and only improve
   examples. That would leave the same broad discretion that caused repeated
   local-only execution.

2. **Define a minimum delegation expectation for repository work.**

   Repository investigation, review, broad search, multi-file analysis, and
   planning-heavy requests should spawn at least one bounded read-only
   specialist when a suitable specialist is available. This is a concrete
   behavioral rule that is easier to follow than generic "when useful" language.

   Alternative considered: require subagents for every coding prompt. That is
   too blunt for commands such as `date`, one known file read, or a single
   repository check where spawning would only add latency.

3. **Keep exceptions explicit and auditable.**

   Local-only execution remains valid for explicit opt-out, unavailable matching
   specialists, trivial single-command checks, immediately blocking work, and
   cases where the parent already has the exact required context. When using an
   exception, the parent should state it briefly at the start or in the final
   verification summary.

   Alternative considered: remove local-only execution entirely. The runtime
   cannot guarantee that subagents are installed or available, so a hard ban
   would make the skill brittle.

4. **Strengthen hooks as behavioral pressure, not runtime force.**

   The UserPromptSubmit hook should inject subagent-first wording. The Stop hook
   should block completion claims for applicable work that mention neither
   delegation nor an allowed local-only reason. This is the strongest reliable
   enforcement available without replacing Codex runtime behavior.

## Risks / Trade-offs

- More subagent calls may increase latency and cost. -> Keep trivial and
  blocking-work exceptions, and require bounded prompts.
- Parent agents may spawn token-wasting agents for simple tasks. -> Add
  examples and tests for allowed local-only cases.
- Stop hook text matching may be imperfect. -> Keep the guard conservative and
  test representative English and Korean completion phrasing.
- Subagents may be unavailable in some sessions. -> Require explicit
  availability checks and local fallback with a stated reason.
