## 1. Wizard State Discovery

- [ ] 1.1 Add a Node.js wizard script that can be launched from the repository
  root without new runtime dependencies.
- [ ] 1.2 Reuse or factor installer helpers to discover configuration sources,
  merged agent config, default target directories, bundled templates, and
  matching installed bundled agent files.
- [ ] 1.3 Build a session object with a local URL, session token, answers JSON
  path, current per-agent state, target choices, and config destination choices.

## 2. Browser Form

- [ ] 2.1 Render a single HTML page from the session object with inline state
  and no external asset requirements.
- [ ] 2.2 Show bundled agent names, descriptions, enabled/disabled state,
  current model, optional reasoning effort, installed file status, and existing
  config source context.
- [ ] 2.3 Provide controls for selecting config destination, target directory,
  per-agent enablement, model strings, and optional reasoning effort overrides.
- [ ] 2.4 Show the local wizard URL in script output after the server starts so
  the Codex agent can report it to the user.

## 3. Submit Handling

- [ ] 3.1 Serve the form on `127.0.0.1` and require the session token for form
  submission.
- [ ] 3.2 Implement `POST /submit` to validate the submitted choices and write
  only the session-scoped answers JSON file.
- [ ] 3.3 Ensure submit handling does not write Codex Orchestrator config files,
  run installer commands, or modify bundled agent TOML files.
- [ ] 3.4 Make the answers path available to the Codex agent through script
  output and the session data.

## 4. Agent Guidance

- [ ] 4.1 Update the install-subagents skill to prefer the local wizard when the
  user can open the reported URL.
- [ ] 4.2 Document that the agent reads the answers JSON, prepares config
  changes, runs `install-subagents.mjs --dry-run`, summarizes the plan, and asks
  for final confirmation before any non-dry-run install.
- [ ] 4.3 Document fallback to the existing chat interview when the wizard is
  unavailable, unsuitable, or declined.

## 5. Verification

- [ ] 5.1 Add tests for wizard state discovery and HTML rendering.
- [ ] 5.2 Add tests for local submit validation, token enforcement, and answers
  JSON persistence.
- [ ] 5.3 Add tests proving submit does not write config files, run installer
  commands, or modify agent TOML files.
- [ ] 5.4 Update skill/documentation tests for the wizard guidance and URL
  reporting requirement.
- [ ] 5.5 Run `bun run test`, `bun run typecheck`, and `bun run lint`.
