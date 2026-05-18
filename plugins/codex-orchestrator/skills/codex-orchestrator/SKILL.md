---
name: codex-orchestrator
description: Orchestrate Codex work by splitting independent subtasks across subagents while the parent agent owns integration and verification.
license: MIT
compatibility: Requires Codex subagent support.
---

# Codex Orchestrator

Use this skill when a task has independent parts that can be delegated to
subagents without blocking the parent agent's immediate next step.

## Operating Model

The parent agent is the orchestrator. It keeps the critical path local, delegates
bounded side work, integrates results, and verifies the final state.

Delegate only when all of these are true:

- The subtask is concrete and self-contained.
- The output will materially advance the user request.
- The subtask can run in parallel with useful local work.
- The subagent can own a clear read scope or write scope.
- The parent agent can review and integrate the result.

Keep work local when the next parent action depends on the answer, the task is
tightly coupled, or the risk of conflicting edits is high.

## Workflow

1. State the goal and the current critical path.
2. Identify independent side tasks that can run in parallel.
3. Assign each subagent a narrow objective, expected output, and ownership scope.
4. Tell coding subagents they are not alone in the codebase and must not revert
   edits made by others.
5. Continue local non-overlapping work while subagents run.
6. Review returned results before integrating them.
7. Run focused verification before reporting completion.

## Delegation Prompt Shape

Use this shape when creating a subagent task:

```text
Task: <single bounded objective>

Context:
- <relevant project facts>
- <constraints from the user or repo>

Ownership:
- Read scope: <paths or symbols>
- Write scope: <paths or modules, or "none">

Output:
- <exact result needed>
- <changed paths if editing>
- <verification commands run>

Coordination:
- You are not alone in the codebase.
- Do not revert unrelated changes or edits made by others.
- Adapt to concurrent changes if you encounter them.
```

## Completion Standard

Do not claim the work is complete just because subagents finished. Completion
requires parent-agent review, integration, and verification appropriate to the
change.
