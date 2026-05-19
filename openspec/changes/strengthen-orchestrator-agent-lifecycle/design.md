## Context

The current orchestrator skill already requires routing decisions to be
conditional on actually available subagents. When a bundled specialist is
missing, the guidance moves directly to fallback roles or parent-local work.
That misses a useful recovery step for this plugin: the repository already ships
an `install-subagents` skill and Node installer that can render the bundled
custom agents.

The current Stop hook also guards completion claims that omit delegation or
verification evidence, but it does not check whether the parent reported cleanup
for completed or no-longer-needed subagent work. Codex documentation describes
subagents as Codex-managed agent threads, not as guaranteed OS processes, so the
plugin should enforce lifecycle hygiene without making unsupported process
termination claims.

## Goals / Non-Goals

**Goals:**
- Make bundled subagent availability checking session-scoped and non-repetitive.
- Direct the parent to use or recommend `install-subagents` once when expected
  bundled specialists are missing at first orchestration use.
- Require the parent to close, stop, or otherwise release completed, failed,
  obsolete, or no-longer-needed Codex-managed subagent threads when the runtime
  exposes a lifecycle control.
- Extend Stop hook completion enforcement so delegated work cannot be reported
  complete without cleanup evidence or an explicit cleanup limitation.

**Non-Goals:**
- Automatically enumerate all open Codex agent threads from the hook.
- Automatically call `close_agent` from hook code.
- Claim that subagents are OS processes or that the plugin can terminate OS
  processes associated with subagents.
- Re-run `install-subagents` on every routing decision.

## Decisions

### Session-scoped availability check

The skill should say the first `codex-orchestrator` use in a Codex session
performs a bundled subagent availability audit and remembers the result for the
session. If expected bundled agents are missing, the parent should use or
recommend the `install-subagents` skill once, then route with whatever
specialists or fallbacks are actually available.

The plugin default prompt should avoid unconditional repeated
`$install-subagents` language. It can still mention that the installer exists,
but the normative one-shot behavior belongs in the orchestrator skill and
session-scoped guidance.

Alternative considered: check and trigger installation before every delegation
decision. This would be noisy and could trap users in repeated setup prompts
when the runtime cannot load a custom agent for reasons outside the repository.

### Cleanup as parent-owned completion evidence

The skill should require cleanup after parent-owned integration, and before a
final completion claim, for every completed, failed, obsolete, or
no-longer-needed Codex-managed subagent thread when a close/stop control is
available.

Alternative considered: make cleanup best-effort advice only. That keeps the
skill simpler, but it does not address the resource-retention concern that led
to this change.

### Hook enforces reporting, not cleanup execution

The Stop hook should detect final completion claims that mention delegation but
do not mention cleanup evidence. It should block with a concise reminder to
close/stop/release unneeded subagent threads or report that no supported
mechanism is available.

Alternative considered: have the hook call lifecycle tools directly. The hook
input does not provide a reliable list of open subagent thread IDs, and hook code
should remain deterministic and testable without direct Codex session control.

## Risks / Trade-offs

- False positives in Stop hook cleanup detection -> keep the guard narrow:
  require cleanup evidence only when the final message both claims completion
  and mentions delegation/subagents.
- Agents may over-report cleanup without actually closing threads -> skill
  guidance must make cleanup a parent-owned action, while hook tests can only
  verify reported evidence.
- Session-scoped memory is behavioral rather than persisted plugin state -> word
  the requirement as parent-agent guidance, not as a durable hook cache.
- Some runtimes may not expose a close/stop control -> allow explicit reporting
  of that limitation and avoid unsupported OS-process claims.
