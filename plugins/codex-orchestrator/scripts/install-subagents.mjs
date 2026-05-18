// @ts-check
import { writeSync } from "node:fs";
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
 * @param {string} text
 * @returns {void}
 */
function writeStdout(text) {
  writeSync(1, text);
}

/**
 * @param {string} text
 * @returns {void}
 */
function writeStderr(text) {
  writeSync(2, text);
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

  return /** @type {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} */ (agents);
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
    typeof fields.model_reasoning_effort === "string" &&
    fields.model_reasoning_effort.trim() !== ""
      ? `model_reasoning_effort = "${fields.model_reasoning_effort}"\n`
      : "";

  return template
    .replaceAll(MODEL_TEMPLATE_TOKEN, fields.model)
    .replaceAll(MODEL_REASONING_EFFORT_LINE_TOKEN, reasoning_effort_line);
}

/**
 * @param {Record<string, { model?: string | null; model_reasoning_effort?: string | null }>} agents
 * @param {Set<string>} template_names
 * @returns {void}
 */
function warnUnknownAgents(agents, template_names) {
  for (const agent_name of Object.keys(agents).sort()) {
    if (!template_names.has(agent_name)) {
      writeStderr(`install-subagents: warning: unknown bundled subagent ${agent_name}\n`);
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
  /** @type {{ content: string; output_path: string }[]} */
  const planned_writes = [];
  /** @type {string[]} */
  const removal_candidates = [];
  /** @type {string[]} */
  const planned_removals = [];

  warnUnknownAgents(agents, template_names);

  for (const template of templates) {
    const output_path = join(target_dir, template.output_name);
    const model = agents[template.agent_name]?.model;

    if (typeof model === "string" && model.trim() !== "") {
      planned_writes.push({
        content: renderTemplate(template.content, {
          model,
          model_reasoning_effort: agents[template.agent_name]?.model_reasoning_effort,
        }),
        output_path,
      });
      continue;
    }

    removal_candidates.push(output_path);
  }

  const existing_removals = await Promise.all(
    [...new Set(removal_candidates)].map(async removal_path => ({
      exists: await fileExists(removal_path),
      removal_path,
    }))
  );

  planned_removals.push(
    ...existing_removals.filter(removal => removal.exists).map(removal => removal.removal_path)
  );

  if (!options.dry_run) {
    await mkdir(target_dir, { recursive: true });
  }

  if (options.dry_run) {
    const write_lines = planned_writes.map(subagent => `[dry-run] write ${subagent.output_path}`);
    const remove_lines = planned_removals.map(output_path => `[dry-run] remove ${output_path}`);

    writeStdout([...write_lines, ...remove_lines].join("\n") + "\n");
    return;
  }

  await Promise.all(
    planned_writes.map(async subagent => {
      await writeFile(subagent.output_path, subagent.content);
    })
  );
  await Promise.all(planned_removals.map(output_path => rm(output_path)));

  writeStdout(
    [
      ...planned_writes.map(subagent => `installed ${subagent.output_path}`),
      ...planned_removals.map(output_path => `removed ${output_path}`),
    ].join("\n") + "\n"
  );
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    writeStdout(USAGE);
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
  installSubagents,
  listTemplateFiles,
  mergeConfigAgents,
  parseOptions,
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

    writeStderr(`install-subagents: ${message}\n${USAGE}`);
    process.exitCode = 1;
  }
}
