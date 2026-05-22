// @ts-check
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

/**
 * @typedef {object} InstallOptions
 * @property {string} asset_dir
 * @property {string | undefined} config_path
 * @property {boolean} dry_run
 * @property {boolean} help
 * @property {string | undefined} target_dir
 */

/**
 * @typedef {object} ConfigSource
 * @property {"global" | "repository" | "explicit"} kind
 * @property {string} path
 */

/**
 * @typedef {object} TemplateDefinition
 * @property {string} agent_name
 * @property {string} content
 * @property {string} file_path
 * @property {string} output_name
 */

/**
 * @typedef {object} InstallPlan
 * @property {{ action: "write" | "overwrite-managed"; content: string; output_path: string }[]} planned_writes
 * @property {{ output_path: string }[]} planned_removals
 * @property {{ output_path: string }[]} preserved_unmanaged
 * @property {{ output_path: string }[]} conflicts
 */

const USAGE = `Usage:
  node install-subagents.mjs [--config <path> --target-dir <dir>] [--dry-run]

Options:
  --config <path>      Explicit Codex Orchestrator JSON config file.
  --target-dir <dir>   Destination directory. Required with --config.
  --asset-dir <dir>    Template directory. Defaults to bundled assets.
  --dry-run            Print planned writes and removals without modifying files.
  --help, -h           Show this help.
`;

const MODEL_TEMPLATE_TOKEN = "{{MODEL}}";
const MODEL_REASONING_EFFORT_LINE_TOKEN = "{{MODEL_REASONING_EFFORT_LINE}}";
const MODEL_REASONING_EFFORT_VALUES = ["low", "medium", "high", "xhigh"];
const MODEL_REASONING_EFFORT_VALUE_SET = new Set(MODEL_REASONING_EFFORT_VALUES);
const MANAGED_MARKER = "# Managed by Codex Orchestrator install-subagents.mjs";
// oxlint-disable-next-line unicorn/prefer-import-meta-properties
const MODULE_PATH = fileURLToPath(import.meta.url);
// oxlint-disable-next-line unicorn/prefer-import-meta-properties
const PLUGIN_ROOT = resolve(dirname(MODULE_PATH), "..");
const DEFAULT_ASSET_DIR = join(PLUGIN_ROOT, "assets", "subagents");
const GLOBAL_CONFIG_PATH = "~/.codex/codex-orchestrator.json";
const GLOBAL_TARGET_DIR = "~/.codex/agents";
const REPOSITORY_CONFIG_NAME = "codex-orchestrator.json";
const REPOSITORY_TARGET_DIR = ".codex/agents";

/**
 * @param {string} path
 * @returns {string}
 */
function expandHome(path) {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return path;
}

/**
 * @param {string} file_path
 * @returns {Promise<boolean>}
 */
async function fileExists(file_path) {
  try {
    const file_stat = await stat(file_path);

    return file_stat.isFile();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

/**
 * @param {string[]} args
 * @returns {InstallOptions}
 */
function parseOptions(args) {
  const { values } = parseArgs({
    args,
    options: {
      "asset-dir": {
        type: "string",
      },
      "dry-run": {
        type: "boolean",
      },
      config: {
        type: "string",
      },
      help: {
        short: "h",
        type: "boolean",
      },
      "target-dir": {
        type: "string",
      },
    },
    strict: true,
  });

  const help = values.help ?? false;

  if (!help && values.config !== undefined && values["target-dir"] === undefined) {
    throw new Error("--target-dir is required when --config is provided.");
  }

  return {
    asset_dir: resolve(expandHome(values["asset-dir"] ?? DEFAULT_ASSET_DIR)),
    config_path: values.config === undefined ? undefined : resolve(expandHome(values.config)),
    dry_run: values["dry-run"] ?? false,
    help,
    target_dir:
      values["target-dir"] === undefined ? undefined : resolve(expandHome(values["target-dir"])),
  };
}

/**
 * @param {string | undefined} explicit_config_path
 * @returns {Promise<ConfigSource[]>}
 */
async function discoverConfigSources(explicit_config_path) {
  const global_config_path = resolve(expandHome(GLOBAL_CONFIG_PATH));
  const repository_config_path = resolve(process.cwd(), REPOSITORY_CONFIG_NAME);
  /** @type {ConfigSource[]} */
  const sources = [];

  if (await fileExists(global_config_path)) {
    sources.push({
      kind: "global",
      path: global_config_path,
    });
  }

  if (await fileExists(repository_config_path)) {
    sources.push({
      kind: "repository",
      path: repository_config_path,
    });
  }

  if (explicit_config_path !== undefined) {
    if (!(await fileExists(explicit_config_path))) {
      throw new Error(`Codex Orchestrator config not found: ${explicit_config_path}.`);
    }

    sources.push({
      kind: "explicit",
      path: explicit_config_path,
    });
  }

  if (sources.length === 0) {
    throw new Error(
      `No Codex Orchestrator configuration found. Checked ${global_config_path} and ${repository_config_path}.`
    );
  }

  return sources;
}

/**
 * @param {string} config_path
 * @returns {Promise<Record<string, { model?: string | null; model_reasoning_effort?: string | null }>>}
 */
async function readConfigAgents(config_path) {
  const text = await readFile(config_path, "utf8");
  const parsed = JSON.parse(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Config must be a JSON object: ${config_path}.`);
  }

  const agents = Reflect.get(parsed, "agents");

  if (typeof agents !== "object" || agents === null || Array.isArray(agents)) {
    throw new Error(`Config must contain an agents object: ${config_path}.`);
  }

  return /** @type {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} */ (
    agents
  );
}

/**
 * @param {ConfigSource[]} sources
 * @returns {Promise<Record<string, { model?: string | null; model_reasoning_effort?: string | null }>>}
 */
async function mergeConfigAgents(sources) {
  /** @type {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} */
  const merged = {};
  const source_agents = await Promise.all(
    sources.map(async source => ({
      agents: await readConfigAgents(source.path),
      path: source.path,
    }))
  );

  for (const { agents, path } of source_agents) {
    for (const [agent_name, fields] of Object.entries(agents)) {
      if (typeof fields !== "object" || fields === null || Array.isArray(fields)) {
        throw new Error(`Agent config must be an object for ${agent_name} in ${path}.`);
      }

      const has_model = Object.hasOwn(fields, "model");
      const model = has_model ? Reflect.get(fields, "model") : undefined;
      const has_model_reasoning_effort = Object.hasOwn(fields, "model_reasoning_effort");
      const model_reasoning_effort = has_model_reasoning_effort
        ? Reflect.get(fields, "model_reasoning_effort")
        : undefined;

      if (has_model && model !== null && typeof model !== "string") {
        throw new Error(`Agent model must be a string or null for ${agent_name} in ${path}.`);
      }

      if (
        has_model_reasoning_effort &&
        model_reasoning_effort !== null &&
        typeof model_reasoning_effort !== "string"
      ) {
        throw new Error(
          `Agent model_reasoning_effort must be a string or null for ${agent_name} in ${path}.`
        );
      }

      if (
        typeof model_reasoning_effort === "string" &&
        !MODEL_REASONING_EFFORT_VALUE_SET.has(model_reasoning_effort)
      ) {
        throw new Error(
          `Agent model_reasoning_effort must be one of ${MODEL_REASONING_EFFORT_VALUES.join(", ")}, or null for ${agent_name} in ${path}.`
        );
      }

      merged[agent_name] = {
        ...merged[agent_name],
        ...(has_model ? { model } : {}),
        ...(has_model_reasoning_effort ? { model_reasoning_effort } : {}),
      };
    }
  }

  return merged;
}

/**
 * @param {string | undefined} configured_target_dir
 * @param {ConfigSource[]} sources
 * @returns {string}
 */
function resolveTargetDir(configured_target_dir, sources) {
  if (configured_target_dir !== undefined) {
    return configured_target_dir;
  }

  const highest_non_explicit = [...sources].reverse().find(source => source.kind !== "explicit");

  if (highest_non_explicit?.kind === "repository") {
    return resolve(process.cwd(), REPOSITORY_TARGET_DIR);
  }

  return resolve(expandHome(GLOBAL_TARGET_DIR));
}

/**
 * @param {string} asset_dir
 * @returns {Promise<string[]>}
 */
async function listTemplateFiles(asset_dir) {
  const entries = await readdir(asset_dir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isFile())
    .map(entry => join(asset_dir, entry.name))
    .filter(file_path => extname(file_path) === ".toml")
    .sort();
}

/**
 * @param {string} file_path
 * @returns {Promise<TemplateDefinition>}
 */
async function readTemplate(file_path) {
  const content = await readFile(file_path, "utf8");
  const name_match = /^name\s*=\s*"([^"\n]+)"\s*$/mu.exec(content);
  const output_name = basename(file_path);

  return {
    agent_name: name_match?.[1]?.trim() ?? basename(file_path, extname(file_path)),
    content,
    file_path,
    output_name,
  };
}

/**
 * @param {string} template
 * @param {{ model: string; model_reasoning_effort?: string | null }} fields
 * @returns {string}
 */
function renderTemplate(template, fields) {
  const reasoning_effort_line =
    typeof fields.model_reasoning_effort === "string"
      ? `model_reasoning_effort = "${escapeTomlBasicString(fields.model_reasoning_effort)}"\n`
      : "";
  const rendered = template
    .replaceAll(MODEL_TEMPLATE_TOKEN, escapeTomlBasicString(fields.model))
    .replaceAll(MODEL_REASONING_EFFORT_LINE_TOKEN, reasoning_effort_line);

  return rendered.startsWith(`${MANAGED_MARKER}\n`) ? rendered : `${MANAGED_MARKER}\n${rendered}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeTomlBasicString(value) {
  let escaped = "";

  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;

    switch (char) {
      case "\\":
        escaped += "\\\\";
        break;
      case "\"":
        escaped += "\\\"";
        break;
      case "\b":
        escaped += "\\b";
        break;
      case "\t":
        escaped += "\\t";
        break;
      case "\n":
        escaped += "\\n";
        break;
      case "\f":
        escaped += "\\f";
        break;
      case "\r":
        escaped += "\\r";
        break;
      default:
        escaped +=
          code < 0x20 || code === 0x7f ? `\\u${code.toString(16).padStart(4, "0")}` : char;
        break;
    }
  }

  return escaped;
}

/**
 * @param {string} file_path
 * @returns {Promise<"absent" | "managed" | "unmanaged">}
 */
async function readTargetState(file_path) {
  try {
    const content = await readFile(file_path, "utf8");

    return content.startsWith(`${MANAGED_MARKER}\n`) ? "managed" : "unmanaged";
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "EISDIR")
    ) {
      return "absent";
    }

    throw error;
  }
}

/**
 * @param {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents
 * @param {Set<string>} template_names
 * @returns {void}
 */
function warnUnknownAgents(agents, template_names) {
  for (const agent_name of Object.keys(agents).sort()) {
    if (!template_names.has(agent_name)) {
      console.warn(`install-subagents: warning: unknown bundled subagent ${agent_name}`);
    }
  }
}

/**
 * @param {InstallOptions} options
 * @returns {Promise<void>}
 */
async function installSubagents(options) {
  const config_sources = await discoverConfigSources(options.config_path);
  const agents = await mergeConfigAgents(config_sources);
  const target_dir = resolveTargetDir(options.target_dir, config_sources);
  const template_files = await listTemplateFiles(options.asset_dir);

  if (template_files.length === 0) {
    throw new Error(`No TOML subagent templates found in ${options.asset_dir}.`);
  }

  const templates = await Promise.all(template_files.map(file_path => readTemplate(file_path)));
  const template_names = new Set(templates.map(template => template.agent_name));
  const plan = await planInstall(templates, agents, target_dir);

  warnUnknownAgents(agents, template_names);
  assertNoConflicts(options.dry_run, plan.conflicts);

  if (!options.dry_run) {
    await mkdir(target_dir, { recursive: true });
  }

  if (options.dry_run) {
    console.info(formatDryRunOutput(plan).slice(0, -1));
    return;
  }

  await writePlannedSubagents(plan.planned_writes);
  await removePlannedSubagents(plan.planned_removals);
  console.info(formatInstallOutput(plan).slice(0, -1));
}

/**
 * @param {TemplateDefinition[]} templates
 * @param {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents
 * @param {string} target_dir
 * @returns {Promise<InstallPlan>}
 */
async function planInstall(templates, agents, target_dir) {
  const template_plans = await Promise.all(
    templates.map(template => planTemplate(template, agents, target_dir))
  );
  const removal_candidates = template_plans.flatMap(plan => plan.removal_candidates);
  const removal_plan = await planRemovals(removal_candidates);

  return {
    conflicts: template_plans.flatMap(plan => plan.conflicts),
    planned_removals: removal_plan.planned_removals,
    planned_writes: template_plans.flatMap(plan => plan.planned_writes),
    preserved_unmanaged: removal_plan.preserved_unmanaged,
  };
}

/**
 * @param {TemplateDefinition} template
 * @param {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents
 * @param {string} target_dir
 * @returns {Promise<InstallPlan & { removal_candidates: string[] }>}
 */
async function planTemplate(template, agents, target_dir) {
  const output_path = join(target_dir, template.output_name);
  const model = agents[template.agent_name]?.model;
  const target_state = await readTargetState(output_path);
  /** @type {InstallPlan & { removal_candidates: string[] }} */
  const plan = {
    conflicts: [],
    planned_removals: [],
    planned_writes: [],
    preserved_unmanaged: [],
    removal_candidates: [],
  };

  if (typeof model !== "string" || model.trim() === "") {
    plan.removal_candidates.push(output_path);
    return plan;
  }

  if (target_state === "unmanaged") {
    plan.conflicts.push({ output_path });
    return plan;
  }

  plan.planned_writes.push({
    action: target_state === "managed" ? "overwrite-managed" : "write",
    content: renderTemplate(template.content, {
      model,
      model_reasoning_effort: agents[template.agent_name]?.model_reasoning_effort,
    }),
    output_path,
  });

  return plan;
}

/**
 * @param {string[]} removal_candidates
 * @returns {Promise<Pick<InstallPlan, "planned_removals" | "preserved_unmanaged">>}
 */
async function planRemovals(removal_candidates) {
  const existing_removals = await Promise.all(
    [...new Set(removal_candidates)].map(async removal_path => ({
      removal_path,
      state: await readTargetState(removal_path),
    }))
  );

  return {
    planned_removals: existing_removals
      .filter(removal => removal.state === "managed")
      .map(removal => ({ output_path: removal.removal_path })),
    preserved_unmanaged: existing_removals
      .filter(removal => removal.state === "unmanaged")
      .map(removal => ({ output_path: removal.removal_path })),
  };
}

/**
 * @param {boolean} dry_run
 * @param {{ output_path: string }[]} conflicts
 * @returns {void}
 */
function assertNoConflicts(dry_run, conflicts) {
  if (dry_run || conflicts.length === 0) {
    return;
  }

  throw new Error(
    `Refusing to overwrite unmanaged target agent file(s): ${conflicts
      .map(conflict => conflict.output_path)
      .join(", ")}`
  );
}

/**
 * @param {InstallPlan} plan
 * @returns {string}
 */
function formatDryRunOutput(plan) {
  return (
    [
      ...plan.planned_writes.map(subagent => `[dry-run] ${subagent.action} ${subagent.output_path}`),
      ...plan.planned_removals.map(removal => `[dry-run] remove-managed ${removal.output_path}`),
      ...plan.preserved_unmanaged.map(
        preserve => `[dry-run] preserve-unmanaged ${preserve.output_path}`
      ),
      ...plan.conflicts.map(conflict => `[dry-run] conflict ${conflict.output_path}`),
    ].join("\n") + "\n"
  );
}

/**
 * @param {InstallPlan} plan
 * @returns {string}
 */
function formatInstallOutput(plan) {
  return (
    [
      ...plan.planned_writes.map(subagent => `installed ${subagent.output_path}`),
      ...plan.planned_removals.map(removal => `removed ${removal.output_path}`),
      ...plan.preserved_unmanaged.map(preserve => `preserved unmanaged ${preserve.output_path}`),
    ].join("\n") + "\n"
  );
}

/**
 * @param {InstallPlan["planned_writes"]} planned_writes
 * @returns {Promise<void>}
 */
async function writePlannedSubagents(planned_writes) {
  await Promise.all(
    planned_writes.map(async subagent => {
      try {
        await writeFile(subagent.output_path, subagent.content);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to write ${subagent.output_path}: ${message}`, { cause: error });
      }
    })
  );
}

/**
 * @param {InstallPlan["planned_removals"]} planned_removals
 * @returns {Promise<void>}
 */
async function removePlannedSubagents(planned_removals) {
  await Promise.all(
    planned_removals.map(async removal => {
      try {
        await rm(removal.output_path);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to remove ${removal.output_path}: ${message}`, { cause: error });
      }
    })
  );
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    console.info(USAGE.trimEnd());
    return;
  }

  await installSubagents(options);
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
  discoverConfigSources,
  escapeTomlBasicString,
  expandHome,
  fileExists,
  installSubagents,
  listTemplateFiles,
  MANAGED_MARKER,
  mergeConfigAgents,
  parseOptions,
  readTargetState,
  readConfigAgents,
  readTemplate,
  renderTemplate,
  resolveTargetDir,
};

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`install-subagents: ${message}\n${USAGE.trimEnd()}`);
    process.exitCode = 1;
  }
}
