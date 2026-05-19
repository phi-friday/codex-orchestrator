## Why

The current install-subagents guidance relies on a chat interview, which makes
multi-agent model selection, existing config review, and overwrite/removal risk
hard to scan. A local browser form can collect the same decisions more reliably
while keeping the installer non-interactive and preserving dry-run confirmation.

## What Changes

- Add a lightweight local subagent install wizard that serves a single browser
  page for collecting installation choices.
- Have the wizard inspect existing configuration sources, bundled agent
  templates, target directory candidates, and matching installed bundled agent
  files before rendering the page.
- Show the browser URL to the user after starting the local Node server.
- Accept a form submit through a minimal local POST endpoint that writes only a
  session-scoped answers JSON file in a Codex-readable temporary location.
- Keep config writes, installer dry-runs, final confirmation, and non-dry-run
  installs under Codex agent control rather than executing them from the web UI.
- Update install-subagents skill guidance to prefer the wizard when available
  and fall back to the existing chat interview when it is unavailable or
  unsuitable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `subagent-configuration`: Agent-driven subagent installation interviews may be
  collected through a local browser wizard with a minimal submit endpoint.

## Impact

- Affected code: `plugins/codex-orchestrator/scripts/`, install-subagents skill
  documentation, installer tests, and possibly shared installer helper exports.
- Affected behavior: agents can offer a local URL for structured model and
  target choices before writing config or running dry-run install commands.
- Dependencies: no new runtime dependency is expected; use Node.js built-ins for
  the local server.
