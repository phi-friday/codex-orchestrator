## 1. Wizard State Discovery

- [x] 1.1 Add a Node.js wizard script that can be launched from the repository
  root without new runtime dependencies.
- [x] 1.2 Reuse or factor installer helpers to discover configuration sources,
  merged agent config, default target directories, bundled templates, and
  matching installed bundled agent files.
- [x] 1.3 Build a session object with a local URL, session token, answers JSON
  path, current per-agent state, target choices, and config destination choices.

## 2. Browser Form

- [x] 2.1 Render a single HTML page from the session object with inline state
  and no external asset requirements.
- [x] 2.2 Show bundled agent names, descriptions, enabled/disabled state,
  current model, optional reasoning effort, installed file status, and existing
  config source context.
- [x] 2.3 Provide controls for selecting config destination, target directory,
  per-agent enablement, model strings, and optional reasoning effort overrides.
- [x] 2.4 Show the local wizard URL in script output after the server starts so
  the Codex agent can report it to the user.

## 3. Submit Handling

- [x] 3.1 Serve the form on `127.0.0.1` and require the session token for form
  submission.
- [x] 3.2 Implement `POST /submit` to validate the submitted choices and write
  only the session-scoped answers JSON file.
- [x] 3.3 Ensure submit handling does not write Codex Orchestrator config files,
  run installer commands, or modify bundled agent TOML files.
- [x] 3.4 Make the answers path available to the Codex agent through script
  output and the session data.

## 4. Agent Guidance

- [x] 4.1 Update the install-subagents skill to prefer the local wizard when the
  user can open the reported URL.
- [x] 4.2 Document that the agent reads the answers JSON, prepares config
  changes, runs `install-subagents.mjs --dry-run`, summarizes the plan, and asks
  for final confirmation before any non-dry-run install.
- [x] 4.3 Document fallback to the existing chat interview when the wizard is
  unavailable, unsuitable, or declined.

## 5. Verification

- [x] 5.1 Add tests for wizard state discovery and HTML rendering.
- [x] 5.2 Add tests for local submit validation, token enforcement, and answers
  JSON persistence.
- [x] 5.3 Add tests proving submit does not write config files, run installer
  commands, or modify agent TOML files.
- [x] 5.4 Update skill/documentation tests for the wizard guidance and URL
  reporting requirement.
- [x] 5.5 Run `bun run test`, `bun run typecheck`, and `bun run lint`.

## 6. Wizard Lifecycle

- [x] 6.1 Update the wizard CLI to wait for the answers JSON file after printing
  the local URL.
- [x] 6.2 Close the local Node server after successful form submission.
- [x] 6.3 Add timeout handling so the wizard exits instead of running
  indefinitely when no answers arrive.
- [x] 6.4 Print submitted answers before the CLI exits so the Codex agent can
  continue without a separate long-running session.
- [x] 6.5 Add regression tests for server shutdown, answers-file waiting,
  timeout behavior, and CLI exit after submit.

## 7. Agent Polling Guidance

- [x] 7.1 Document that agents must keep the wizard command session open and
  poll it until it exits or times out.
- [x] 7.2 Document that agents must not finish their response while the wizard
  command is still running.
- [x] 7.3 Add documentation assertions for the polling guidance.

## 8. Browser Submit Completion

- [x] 8.1 Attempt to close the browser page after successful form submit.
- [x] 8.2 Show fallback text that the tab can be closed when the browser blocks
  automatic closing.
- [x] 8.3 Add a rendering regression test for the browser close attempt and
  fallback text.
