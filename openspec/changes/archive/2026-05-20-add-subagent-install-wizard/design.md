## Context

The bundled subagent installer is intentionally non-interactive: it reads JSON
configuration, renders bundled TOML templates, supports dry-run planning, and
performs writes only after the agent has gathered user intent. The
install-subagents skill currently tells agents to conduct that interview in
chat, but the decision surface is structured: configuration source, target
directory, existing installed files, per-agent enabled state, model, and
optional reasoning effort.

The wizard should improve that input collection without moving installer
authority into a browser UI. The user should get a local URL after the Node
server starts, complete a browser form, and submit answers that Codex can read
from a known temporary JSON file.

## Goals / Non-Goals

**Goals:**

- Provide a local browser wizard for structured install-subagents interviews.
- Show the URL to the user after the local Node server starts.
- Render current configuration and installed bundled agent state into the page.
- Capture enabled/disabled agents, model choices, optional reasoning effort
  choices, selected configuration destination, and selected target directory.
- Persist submitted answers to a session-scoped JSON file that the Codex agent
  can read after the user submits the form.
- Wait for the answers JSON file after starting the server, read it as soon as
  it exists, and exit the Node process after submit.
- Enforce a timeout so a wizard process cannot remain alive indefinitely when a
  user never submits the form.
- Keep config writing, dry-run execution, dry-run summary, final confirmation,
  and non-dry-run install execution in the Codex agent flow.
- Use Node.js built-ins and avoid adding a web framework dependency.

**Non-Goals:**

- The wizard does not directly write `codex-orchestrator.json`.
- The wizard does not run `install-subagents.mjs`, including dry-run mode.
- The wizard does not provide a general-purpose API for editing arbitrary files.
- The wizard does not need a persistent daemon or multi-user mode.

## Decisions

### Use a tiny local server instead of a pure static page

The form page is mostly static HTML with inline state, but the final submit uses
`POST /submit` so the Node process can write the answers JSON to a known path.
This avoids relying on browser downloads, File System Access API support, or a
user manually saving to an exact path.

Alternative considered: generate a static HTML file only. That is simpler, but
the browser cannot automatically write to an arbitrary `/tmp` path from static
JavaScript. It would require copy/paste or a manual download step.

### Limit the server to input collection

The server only serves the page and records one submitted answers document. It
does not write the final Codex Orchestrator config and does not run the
installer. This keeps the existing safety model: Codex reads answers, prepares
or updates config, runs `--dry-run`, summarizes writes/removals, and asks for
final confirmation before installation.

Alternative considered: add endpoints for preview, config write, and install.
That would make the browser workflow smoother but duplicates installer safety
logic and expands the authority of the local server.

### Bind locally and scope submissions by session

The server binds to `127.0.0.1`, generates a per-session token, includes that
token in the page, and requires it on submit. The answers file is written under
a session-scoped temporary directory such as
`/tmp/codex-orchestrator/subagent-install/<session>/answers.json`.

Alternative considered: omit session tokens because the server is local-only.
The token is cheap and prevents accidental cross-submit between multiple wizard
sessions.

### Reuse installer discovery helpers where practical

The wizard should reuse existing installer behavior for home expansion,
configuration discovery, config merging, target directory defaults, template
listing, and bundled agent names where those helpers are suitable. If dry-run
planning needs structured data later, that should be factored separately, but
this change should not require structured installer planning to land.

### Treat submit as wizard completion

The CLI should not keep running after a successful form submit. After the server
starts it prints the local URL and answers path, then waits for the answers JSON
file. The `POST /submit` handler writes the answers file and closes the server.
The CLI then reads the answers file, prints the submitted JSON for Codex, and
exits. A timeout stops the server and fails the command when no answers arrive.

Alternative considered: leave the server alive and rely on the parent Codex
agent to stop it. That works in manual tests, but it makes process cleanup
depend on the agent remembering to terminate a long-running session.

## Risks / Trade-offs

- Local browser cannot open automatically in all agent environments -> The
  agent reports the URL and the user opens it manually when needed.
- Server process may outlive the interview -> The CLI waits for the answers file
  with a timeout and closes the server after submit or timeout.
- Multiple simultaneous wizard sessions could conflict -> Use unique session
  IDs and session-scoped output directories.
- Browser UI can submit stale state if config changes while open -> Treat the
  answers as user intent and have Codex run the normal dry-run review against
  current files before any install.
- Model presets can become stale -> Allow custom model strings in addition to
  any preset values rendered from current config or documented defaults.
