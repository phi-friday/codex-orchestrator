// @ts-check
// oxlint-disable eslint/max-lines
import { createServer } from "node:http";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
  expandHome,
  fileExists,
  listTemplateFiles,
  mergeConfigAgents,
  readTemplate,
} from "./install-subagents.mjs";

/**
 * @typedef {object} WizardOptions
 * @property {string} asset_dir
 * @property {string | undefined} answers_dir
 * @property {string | undefined} config_path
 * @property {string} cwd
 * @property {string} global_config_path
 * @property {boolean} help
 * @property {string} host
 * @property {number} port
 * @property {string | undefined} target_dir
 * @property {number} [timeout_ms]
 */

/**
 * @typedef {object} WizardSession
 * @property {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents_config
 * @property {string} answers_path
 * @property {{ exists: boolean; kind: string; path: string; selected: boolean }[]} config_destinations
 * @property {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @property {string} cwd
 * @property {{ agent_name: string; description: string; installed: boolean; model: string | null; model_reasoning_effort: string | null; output_name: string }[]} agents
 * @property {string} session_id
 * @property {{ exists: boolean; kind: string; path: string; selected: boolean }[]} target_dirs
 * @property {string} token
 * @property {string | undefined} url
 */

const USAGE = `Usage:
  node install-subagents-wizard.mjs [--config <path>] [--target-dir <dir>] [--port <number>]

Options:
  --config <path>       Explicit Codex Orchestrator JSON config path to include.
  --target-dir <dir>    Target directory choice to include and preselect.
  --asset-dir <dir>     Template directory. Defaults to bundled assets.
  --answers-dir <dir>   Directory for the submitted answers JSON.
  --host <host>         Host to bind. Defaults to 127.0.0.1.
  --port <number>       Port to bind. Defaults to 0, allowing Node to choose.
  --timeout-ms <number> Milliseconds to wait for submit. Defaults to 600000.
  --help, -h            Show this help.
`;

const BUNDLED_AGENT_NAMES = new Set([
  "designer",
  "fixer",
  "librarian",
  "observer",
  "oracle",
  "orchestrator-explorer",
]);
const CONFIG_NAME = "codex-orchestrator.json";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 0;
const DEFAULT_TIMEOUT_MS = 600_000;
const GLOBAL_CONFIG_PATH = "~/.codex/codex-orchestrator.json";
const GLOBAL_TARGET_DIR = "~/.codex/agents";
const MAX_SUBMIT_BYTES = 65_536;
const PLUGIN_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_ASSET_DIR = join(PLUGIN_ROOT, "assets", "subagents");
const REASONING_EFFORT_VALUES = new Set(["inherit", "low", "medium", "high", "xhigh", null]);
const REPOSITORY_TARGET_DIR = ".codex/agents";

/**
 * @param {string[]} args
 * @returns {WizardOptions}
 */
function parseWizardOptions(args) {
  const { values } = parseArgs({
    args,
    options: {
      "answers-dir": {
        type: "string",
      },
      "asset-dir": {
        type: "string",
      },
      config: {
        type: "string",
      },
      help: {
        short: "h",
        type: "boolean",
      },
      host: {
        type: "string",
      },
      port: {
        type: "string",
      },
      "target-dir": {
        type: "string",
      },
      "timeout-ms": {
        type: "string",
      },
    },
    strict: true,
  });

  return {
    asset_dir: resolve(expandHome(values["asset-dir"] ?? DEFAULT_ASSET_DIR)),
    answers_dir:
      values["answers-dir"] === undefined ? undefined : resolve(expandHome(values["answers-dir"])),
    config_path: values.config === undefined ? undefined : resolve(expandHome(values.config)),
    cwd: process.cwd(),
    global_config_path: resolve(expandHome(GLOBAL_CONFIG_PATH)),
    help: values.help ?? false,
    host: values.host ?? DEFAULT_HOST,
    port: parsePort(values.port ?? String(DEFAULT_PORT)),
    target_dir:
      values["target-dir"] === undefined ? undefined : resolve(expandHome(values["target-dir"])),
    timeout_ms: parseNonNegativeInteger(values["timeout-ms"] ?? String(DEFAULT_TIMEOUT_MS)),
  };
}

/**
 * @param {string} value
 * @returns {number}
 */
function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Invalid port: ${value}.`);
  }

  return port;
}

/**
 * @param {string} value
 * @returns {number}
 */
function parseNonNegativeInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid non-negative integer: ${value}.`);
  }

  return parsed;
}

/**
 * @param {string} global_config_path
 * @param {string} cwd
 * @param {string | undefined} explicit_config_path
 * @returns {Promise<{ exists: boolean; kind: string; path: string }[]>}
 */
async function discoverWizardConfigSources(global_config_path, cwd, explicit_config_path) {
  const sources = [
    {
      kind: "global",
      path: global_config_path,
    },
    {
      kind: "repository",
      path: resolve(cwd, CONFIG_NAME),
    },
  ];

  if (explicit_config_path !== undefined) {
    sources.push({
      kind: "explicit",
      path: explicit_config_path,
    });
  }

  return await Promise.all(
    sources.map(async source => ({
      exists: await fileExists(source.path),
      kind: source.kind,
      path: source.path,
    }))
  );
}

/**
 * @param {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @returns {{ kind: "global" | "repository" | "explicit"; path: string }[]}
 */
function existingConfigSources(config_sources) {
  return config_sources
    .filter(source => source.exists)
    .map(source => ({
      kind: /** @type {"global" | "repository" | "explicit"} */ (source.kind),
      path: source.path,
    }));
}

/**
 * @param {string} cwd
 * @param {string | undefined} configured_target_dir
 * @param {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @returns {string}
 */
function resolveWizardDefaultTarget(cwd, configured_target_dir, config_sources) {
  if (configured_target_dir !== undefined) {
    return configured_target_dir;
  }

  const highest_non_explicit = [...config_sources]
    .reverse()
    .find(source => source.exists && source.kind !== "explicit");

  if (highest_non_explicit?.kind === "repository") {
    return resolve(cwd, REPOSITORY_TARGET_DIR);
  }

  if (highest_non_explicit?.kind === "global") {
    return resolve(expandHome(GLOBAL_TARGET_DIR));
  }

  return resolve(cwd, REPOSITORY_TARGET_DIR);
}

/**
 * @param {string} cwd
 * @param {string | undefined} configured_target_dir
 * @param {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @returns {Promise<{ exists: boolean; kind: string; path: string; selected: boolean }[]>}
 */
async function buildTargetChoices(cwd, configured_target_dir, config_sources) {
  const default_target = resolveWizardDefaultTarget(cwd, configured_target_dir, config_sources);
  const choices = [
    {
      kind: "default",
      path: default_target,
    },
    {
      kind: "global",
      path: resolve(expandHome(GLOBAL_TARGET_DIR)),
    },
    {
      kind: "repository",
      path: resolve(cwd, REPOSITORY_TARGET_DIR),
    },
  ];

  if (
    configured_target_dir !== undefined &&
    !choices.some(choice => choice.path === configured_target_dir)
  ) {
    choices.push({
      kind: "explicit",
      path: configured_target_dir,
    });
  }

  return await Promise.all(
    choices.map(async choice => ({
      exists: await directoryExists(choice.path),
      kind: choice.kind,
      path: choice.path,
      selected: choice.path === default_target,
    }))
  );
}

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function directoryExists(path) {
  try {
    const path_stat = await stat(path);

    return path_stat.isDirectory();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

/**
 * @param {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @returns {Promise<Record<string, { model?: string | null; model_reasoning_effort?: string | null }>>}
 */
async function readMergedWizardConfig(config_sources) {
  const sources = existingConfigSources(config_sources);

  return sources.length === 0 ? {} : await mergeConfigAgents(sources);
}

/**
 * @param {string} target_dir
 * @returns {Promise<Set<string>>}
 */
async function readInstalledNames(target_dir) {
  try {
    const entries = await readdir(target_dir, { withFileTypes: true });

    return new Set(
      entries
        .filter(entry => entry.isFile())
        .map(entry => basename(entry.name, extname(entry.name)))
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

/**
 * @param {string} asset_dir
 * @param {string} target_dir
 * @param {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents_config
 * @returns {Promise<WizardSession["agents"]>}
 */
async function buildAgentStates(asset_dir, target_dir, agents_config) {
  const template_files = await listTemplateFiles(asset_dir);
  const templates = await Promise.all(template_files.map(file_path => readTemplate(file_path)));
  const installed_names = await readInstalledNames(target_dir);

  return templates
    .filter(template => BUNDLED_AGENT_NAMES.has(template.agent_name))
    .map(template => ({
      agent_name: template.agent_name,
      description: readTomlString(template.content, "description") ?? "",
      installed: installed_names.has(template.agent_name),
      model: normalizeModel(agents_config[template.agent_name]?.model),
      model_reasoning_effort: normalizeReasoningEffort(
        agents_config[template.agent_name]?.model_reasoning_effort
      ),
      output_name: template.output_name,
    }))
    .sort((left, right) => left.agent_name.localeCompare(right.agent_name));
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function normalizeModel(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function normalizeReasoningEffort(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * @param {string} toml
 * @param {string} field
 * @returns {string | null}
 */
function readTomlString(toml, field) {
  const match = new RegExp(`^${field}\\s*=\\s*"([^"\\n]*)"\\s*$`, "mu").exec(toml);

  return match?.[1] ?? null;
}

/**
 * @param {WizardOptions} options
 * @returns {Promise<WizardSession>}
 */
async function createWizardSession(options) {
  const session_id = randomUUID();
  const token = randomBytes(16).toString("hex");
  const config_sources = await discoverWizardConfigSources(
    options.global_config_path,
    options.cwd,
    options.config_path
  );
  const agents_config = await readMergedWizardConfig(config_sources);
  const target_dirs = await buildTargetChoices(options.cwd, options.target_dir, config_sources);
  const selected_target = target_dirs.find(target => target.selected)?.path ?? target_dirs[0]?.path;

  if (selected_target === undefined) {
    throw new Error("No target directory choices were created.");
  }

  const answers_dir =
    options.answers_dir ?? join(tmpdir(), "codex-orchestrator", "subagent-install", session_id);
  const agents = await buildAgentStates(options.asset_dir, selected_target, agents_config);

  return {
    agents,
    agents_config,
    answers_path: join(answers_dir, "answers.json"),
    config_destinations: buildConfigDestinations(config_sources),
    config_sources,
    cwd: options.cwd,
    session_id,
    target_dirs,
    token,
    url: undefined,
  };
}

/**
 * @param {{ exists: boolean; kind: string; path: string }[]} config_sources
 * @returns {{ exists: boolean; kind: string; path: string; selected: boolean }[]}
 */
function buildConfigDestinations(config_sources) {
  const selected = [...config_sources].reverse().find(source => source.exists) ?? config_sources[1];

  return config_sources.map(source => ({
    ...source,
    selected: source.path === selected?.path,
  }));
}

/**
 * @param {WizardSession} session
 * @returns {string}
 */
function renderWizardHtml(session) {
  const state_json = escapeScriptJson(JSON.stringify(session));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Codex Orchestrator Subagent Wizard</title>
  <style>${renderCss()}</style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Codex Orchestrator</p>
      <h1>Subagent install wizard</h1>
      <p>Choose config, target, and per-agent settings. This only submits answers; Codex runs dry-run and install later.</p>
    </header>
    <form id="wizard-form">
      <section class="layout">
        <aside>
          ${renderSources(session)}
          ${renderTargets(session)}
          <section class="panel sticky">
            <h2>Summary</h2>
            <p id="summary">Review choices before submitting.</p>
            <button type="submit">Submit answers</button>
            <button type="reset" class="secondary">Reset changes</button>
            <p id="status" role="status"></p>
          </section>
        </aside>
        <section class="agents">
          <h2>Agents</h2>
          ${session.agents.map(agent => renderAgent(agent)).join("")}
        </section>
      </section>
    </form>
  </main>
  <script type="application/json" id="wizard-state">${state_json}</script>
  <script>${renderClientScript()}</script>
</body>
</html>`;
}

/**
 * @returns {string}
 */
function renderCss() {
  return `
* { box-sizing: border-box; }
body { margin: 0; color: #172026; background: #f5f7f8; font: 14px/1.45 system-ui, sans-serif; }
main { max-width: 1180px; margin: 0 auto; padding: 28px; }
header { margin-bottom: 24px; }
h1, h2, h3, p { margin-top: 0; }
h1 { font-size: 32px; line-height: 1.1; margin-bottom: 8px; }
h2 { font-size: 16px; margin-bottom: 12px; }
h3 { font-size: 15px; margin-bottom: 4px; }
.eyebrow { color: #59636b; font-weight: 700; text-transform: uppercase; }
.layout { display: grid; grid-template-columns: 330px 1fr; gap: 18px; align-items: start; }
.panel, .agent { background: #fff; border: 1px solid #d8dee4; border-radius: 8px; padding: 16px; }
.panel { margin-bottom: 14px; }
.sticky { position: sticky; top: 16px; }
.choice, .row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-top: 1px solid #eef1f3; }
.choice:first-of-type, .row:first-of-type { border-top: 0; }
.agents { display: grid; gap: 12px; }
.agent { display: grid; grid-template-columns: minmax(0, 1fr) 180px 150px; gap: 14px; align-items: start; }
.muted { color: #63707a; font-size: 12px; overflow-wrap: anywhere; }
.badge { display: inline-block; margin-right: 6px; padding: 2px 7px; border: 1px solid #cfd6dd; border-radius: 999px; color: #40505c; font-size: 12px; }
label { font-weight: 650; }
input[type="text"], select { width: 100%; border: 1px solid #b9c2ca; border-radius: 6px; padding: 8px; background: #fff; }
button { width: 100%; border: 0; border-radius: 6px; padding: 10px 12px; color: #fff; background: #175ddc; font-weight: 700; cursor: pointer; }
button.secondary { margin-top: 8px; color: #172026; background: #e9edf1; }
button:disabled { cursor: wait; opacity: 0.7; }
#status { min-height: 20px; margin: 10px 0 0; }
@media (max-width: 840px) {
  main { padding: 18px; }
  .layout, .agent { grid-template-columns: 1fr; }
  .sticky { position: static; }
}`;
}

/**
 * @param {WizardSession} session
 * @returns {string}
 */
function renderSources(session) {
  return `<section class="panel">
    <h2>Config destination</h2>
    ${session.config_destinations
      .map(
        source => `<label class="choice">
          <input type="radio" name="config_destination" value="${escapeAttribute(source.path)}" ${source.selected ? "checked" : ""}>
          <span><strong>${escapeHtml(source.kind)}</strong><br><span class="muted">${escapeHtml(source.path)} · ${source.exists ? "exists" : "new"}</span></span>
        </label>`
      )
      .join("")}
  </section>`;
}

/**
 * @param {WizardSession} session
 * @returns {string}
 */
function renderTargets(session) {
  return `<section class="panel">
    <h2>Target directory</h2>
    ${session.target_dirs
      .map(
        target => `<label class="choice">
          <input type="radio" name="target_dir" value="${escapeAttribute(target.path)}" ${target.selected ? "checked" : ""}>
          <span><strong>${escapeHtml(target.kind)}</strong><br><span class="muted">${escapeHtml(target.path)} · ${target.exists ? "exists" : "new"}</span></span>
        </label>`
      )
      .join("")}
  </section>`;
}

/**
 * @param {WizardSession["agents"][number]} agent
 * @returns {string}
 */
function renderAgent(agent) {
  const enabled = agent.model !== null;

  return `<section class="agent" data-agent="${escapeAttribute(agent.agent_name)}">
    <div>
      <h3>${escapeHtml(agent.agent_name)}</h3>
      <p>${escapeHtml(agent.description)}</p>
      <span class="badge">${agent.installed ? "Installed" : "Not installed"}</span>
      <span class="badge">${enabled ? "Enabled" : "Disabled"}</span>
      <p class="muted">${escapeHtml(agent.output_name)}</p>
      <label class="choice">
        <input type="checkbox" name="${escapeAttribute(agent.agent_name)}:enabled" ${enabled ? "checked" : ""}>
        <span>Enable agent</span>
      </label>
    </div>
    <label>Model
      <input type="text" name="${escapeAttribute(agent.agent_name)}:model" value="${escapeAttribute(agent.model ?? "")}" placeholder="gpt-5.4-mini">
    </label>
    <label>Reasoning effort
      <select name="${escapeAttribute(agent.agent_name)}:effort">
        ${renderEffortOptions(agent.model_reasoning_effort)}
      </select>
    </label>
  </section>`;
}

/**
 * @param {string | null} selected
 * @returns {string}
 */
function renderEffortOptions(selected) {
  const options = [
    ["inherit", "Inherit current value"],
    ["low", "low"],
    ["medium", "medium"],
    ["high", "high"],
    ["xhigh", "xhigh"],
  ];

  return options
    .map(([value, label]) => {
      const selected_attribute = value === (selected ?? "inherit") ? " selected" : "";

      return `<option value="${value}"${selected_attribute}>${label}</option>`;
    })
    .join("");
}

/**
 * @returns {string}
 */
function renderClientScript() {
  return `
const state = JSON.parse(document.getElementById("wizard-state").textContent);
const form = document.getElementById("wizard-form");
const status = document.getElementById("status");
const summary = document.getElementById("summary");
function collectAnswers() {
  const data = new FormData(form);
  const agents = {};
  for (const agent of state.agents) {
    const enabled = data.get(agent.agent_name + ":enabled") === "on";
    const effort = data.get(agent.agent_name + ":effort");
    agents[agent.agent_name] = {
      enabled,
      model: enabled ? String(data.get(agent.agent_name + ":model") || "").trim() : null,
      model_reasoning_effort: effort === "inherit" ? null : effort
    };
  }
  return {
    token: state.token,
    config_destination: String(data.get("config_destination") || ""),
    target_dir: String(data.get("target_dir") || ""),
    agents
  };
}
function updateSummary() {
  const answers = collectAnswers();
  const values = Object.values(answers.agents);
  const enabled = values.filter(agent => agent.enabled).length;
  summary.textContent = enabled + " enabled, " + (values.length - enabled) + " disabled · " + answers.target_dir;
}
form.addEventListener("input", updateSummary);
form.addEventListener("reset", () => setTimeout(updateSummary, 0));
form.addEventListener("submit", async event => {
  event.preventDefault();
  status.textContent = "Submitting...";
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const response = await fetch("/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(collectAnswers())
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Submit failed.");
    status.textContent = "Answers submitted. This tab can be closed.";
    setTimeout(() => {
      window.close();
      status.textContent = "Answers submitted. This tab can be closed.";
    }, 150);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
    button.disabled = false;
  }
});
updateSummary();`;
}

/**
 * @param {WizardSession} session
 * @param {unknown} body
 * @returns {Promise<object>}
 */
async function saveSubmittedAnswers(session, body) {
  const answers = validateAnswers(session, body);
  const output = {
    ...answers,
    schema_version: 1,
    session_id: session.session_id,
    submitted_at: new Date().toISOString(),
  };

  await mkdir(dirname(session.answers_path), { recursive: true });
  await writeFile(session.answers_path, JSON.stringify(output, null, 2) + "\n", "utf8");

  return output;
}

/**
 * @param {WizardSession} session
 * @param {unknown} body
 * @returns {{ agents: Record<string, { enabled: boolean; model: string | null; model_reasoning_effort: string | null }>; config_destination: string; target_dir: string }}
 */
function validateAnswers(session, body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Submitted answers must be a JSON object.");
  }

  const input = /** @type {Record<string, unknown>} */ (body);

  if (input.token !== session.token) {
    throw new Error("Invalid wizard session token.");
  }

  return {
    agents: validateAgentAnswers(session, input.agents),
    config_destination: validateChoice(input.config_destination, session.config_destinations),
    target_dir: validateChoice(input.target_dir, session.target_dirs),
  };
}

/**
 * @param {unknown} value
 * @param {{ path: string }[]} choices
 * @returns {string}
 */
function validateChoice(value, choices) {
  if (typeof value !== "string" || !choices.some(choice => choice.path === value)) {
    throw new Error("Submitted choices do not match this wizard session.");
  }

  return value;
}

/**
 * @param {WizardSession} session
 * @param {unknown} value
 * @returns {Record<string, { enabled: boolean; model: string | null; model_reasoning_effort: string | null }>}
 */
function validateAgentAnswers(session, value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Submitted agents must be a JSON object.");
  }

  const agents = /** @type {Record<string, unknown>} */ (value);
  const allowed_names = new Set(session.agents.map(agent => agent.agent_name));

  return Object.fromEntries(
    [...allowed_names].map(agent_name => [agent_name, validateAgentAnswer(agents[agent_name])])
  );
}

/**
 * @param {unknown} value
 * @returns {{ enabled: boolean; model: string | null; model_reasoning_effort: string | null }}
 */
function validateAgentAnswer(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Submitted agent choice must be an object.");
  }

  const agent = /** @type {Record<string, unknown>} */ (value);
  const enabled = agent.enabled === true;
  const model =
    typeof agent.model === "string" && agent.model.trim() !== "" ? agent.model.trim() : null;
  const effort = agent.model_reasoning_effort ?? null;

  if (enabled && model === null) {
    throw new Error("Enabled agents require a model.");
  }

  if (!REASONING_EFFORT_VALUES.has(/** @type {string | null} */ (effort))) {
    throw new Error("Invalid reasoning effort.");
  }

  return {
    enabled,
    model: enabled ? model : null,
    model_reasoning_effort: typeof effort === "string" && effort !== "inherit" ? effort : null,
  };
}

/**
 * @param {WizardSession} session
 * @returns {import("node:http").Server}
 */
function createWizardServer(session) {
  const server = createServer((request, response) => {
    void handleRequest(session, request, response, () => {
      setImmediate(() => {
        void closeWizardServer(server);
      });
    });
  });

  return server;
}

/**
 * @param {WizardSession} session
 * @param {import("node:http").IncomingMessage} request
 * @param {import("node:http").ServerResponse} response
 * @param {() => void} on_submit
 * @returns {Promise<void>}
 */
async function handleRequest(session, request, response, on_submit) {
  try {
    if (request.method === "GET" && request.url === "/") {
      send(response, 200, "text/html; charset=utf-8", renderWizardHtml(session));
      return;
    }

    if (request.method === "POST" && request.url === "/submit") {
      const body = JSON.parse(await readRequestBody(request));
      await saveSubmittedAnswers(session, body);
      sendJson(response, 200, { answers_path: session.answers_path, ok: true });
      on_submit();
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * @param {import("node:http").IncomingMessage} request
 * @returns {Promise<string>}
 */
async function readRequestBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    size += buffer.length;
    if (size > MAX_SUBMIT_BYTES) {
      throw new Error("Submitted answers are too large.");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

/**
 * @param {import("node:http").ServerResponse} response
 * @param {number} status
 * @param {object} body
 * @returns {void}
 */
function sendJson(response, status, body) {
  send(response, status, "application/json; charset=utf-8", JSON.stringify(body));
}

/**
 * @param {import("node:http").ServerResponse} response
 * @param {number} status
 * @param {string} content_type
 * @param {string} body
 * @returns {void}
 */
function send(response, status, content_type, body) {
  response.writeHead(status, {
    "content-type": content_type,
  });
  response.end(body);
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeScriptJson(value) {
  return value
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value);
}

/**
 * @param {WizardSession} session
 * @param {WizardOptions} options
 * @returns {Promise<import("node:http").Server>}
 */
async function listenWizard(session, options) {
  const server = createWizardServer(session);

  await /** @type {Promise<void>} */ (
    new Promise((resolve_promise, reject_promise) => {
      server.once("error", reject_promise);
      server.listen(options.port, options.host, () => {
        server.off("error", reject_promise);
        resolve_promise();
      });
    })
  );

  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : options.port;

  session.url = `http://${options.host}:${port}/`;

  return server;
}

/**
 * @param {import("node:http").Server} server
 * @returns {Promise<void>}
 */
async function closeWizardServer(server) {
  if (!server.listening) {
    return;
  }

  await /** @type {Promise<void>} */ (
    new Promise((resolve_promise, reject_promise) => {
      server.close(error => {
        if (error === undefined) {
          resolve_promise();
          return;
        }

        reject_promise(error);
      });
    })
  );
}

/**
 * @param {string} answers_path
 * @param {number} timeout_ms
 * @param {number} poll_interval_ms
 * @returns {Promise<string>}
 */
async function waitForAnswersFile(answers_path, timeout_ms, poll_interval_ms = 250) {
  const deadline = Date.now() + timeout_ms;

  return await new Promise((resolve_promise, reject_promise) => {
    const check = () => {
      void readFile(answers_path, "utf8")
        .then(resolve_promise)
        .catch((/** @type {unknown} */ error) => {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            const remaining = deadline - Date.now();

            if (remaining >= 0) {
              setTimeout(check, Math.min(poll_interval_ms, remaining));
              return;
            }

            reject_promise(new Error(`Timed out waiting for wizard answers: ${answers_path}`));
            return;
          }

          reject_promise(error);
        });
    };

    check();
  });
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const options = parseWizardOptions(process.argv.slice(2));

  if (options.help) {
    console.info(USAGE.trimEnd());
    return;
  }

  const session = await createWizardSession(options);
  const server = await listenWizard(session, options);
  const timeout_ms = options.timeout_ms ?? DEFAULT_TIMEOUT_MS;

  console.info(`wizard url ${session.url}`);
  console.info(`answers path ${session.answers_path}`);

  try {
    const answers = await waitForAnswersFile(session.answers_path, timeout_ms);

    console.info(`submitted answers ${session.answers_path}\n${answers.trimEnd()}`);
  } finally {
    await closeWizardServer(server);
  }
}

/**
 * @param {string} module_url
 * @param {string | undefined} entry_path
 * @returns {boolean}
 */
function isMainModule(module_url, entry_path) {
  return entry_path !== undefined && module_url === pathToFileURL(resolve(entry_path)).href;
}

export {
  createWizardServer,
  createWizardSession,
  listenWizard,
  parseWizardOptions,
  renderWizardHtml,
  saveSubmittedAnswers,
  validateAnswers,
  waitForAnswersFile,
};

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`install-subagents-wizard: ${message}\n${USAGE.trimEnd()}`);
    process.exitCode = 1;
  }
}
