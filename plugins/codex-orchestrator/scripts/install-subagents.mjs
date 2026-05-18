// @ts-check
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

/**
 * @typedef {object} InstallOptions
 * @property {string} asset_dir
 * @property {boolean} dry_run
 * @property {boolean} help
 * @property {string} model
 * @property {string} target_dir
 */

const USAGE = `Usage:
  node install-subagents.mjs --model <model> [--target-dir <dir>] [--dry-run]

Options:
  --model, -m <model>  Model name to write into each subagent definition.
  --target-dir <dir>   Destination directory. Defaults to ~/.codex/agents.
  --asset-dir <dir>    Template directory. Defaults to bundled assets.
  --dry-run            Print planned writes without modifying files.
  --help, -h           Show this help.
`;

const TEMPLATE_TOKEN = "{{MODEL}}";
const PLUGIN_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_ASSET_DIR = join(PLUGIN_ROOT, "assets", "subagents");
const DEFAULT_TARGET_DIR = "~/.codex/agents";

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
  process.stdout.write(text);
}

/**
 * @param {string} text
 * @returns {void}
 */
function writeStderr(text) {
  process.stderr.write(text);
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
      help: {
        short: "h",
        type: "boolean",
      },
      model: {
        short: "m",
        type: "string",
      },
      "target-dir": {
        type: "string",
      },
    },
    strict: true,
  });

  const help = values.help ?? false;
  const model = values.model;

  if (!help && model === undefined) {
    throw new Error("Missing required --model option.");
  }

  return {
    asset_dir: resolve(expandHome(values["asset-dir"] ?? DEFAULT_ASSET_DIR)),
    dry_run: values["dry-run"] ?? false,
    help,
    model: model ?? "",
    target_dir: resolve(expandHome(values["target-dir"] ?? DEFAULT_TARGET_DIR)),
  };
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
    .filter(file_path => [".yaml", ".yml"].includes(extname(file_path)))
    .sort();
}

/**
 * @param {string} file_path
 * @param {string} model
 * @returns {Promise<string>}
 */
async function renderTemplate(file_path, model) {
  const template = await readFile(file_path, "utf8");

  return template.replaceAll(TEMPLATE_TOKEN, model);
}

/**
 * @param {InstallOptions} options
 * @returns {Promise<void>}
 */
async function installSubagents(options) {
  const template_files = await listTemplateFiles(options.asset_dir);

  if (template_files.length === 0) {
    throw new Error(`No YAML subagent templates found in ${options.asset_dir}.`);
  }

  if (!options.dry_run) {
    await mkdir(options.target_dir, { recursive: true });
  }

  const rendered_subagents = await Promise.all(
    template_files.map(async template_file => {
      return {
        content: await renderTemplate(template_file, options.model),
        output_path: join(options.target_dir, basename(template_file)),
      };
    })
  );

  if (options.dry_run) {
    writeStdout(
      rendered_subagents.map(subagent => `[dry-run] write ${subagent.output_path}`).join("\n") +
        "\n"
    );
    return;
  }

  await Promise.all(
    rendered_subagents.map(async subagent => {
      await writeFile(subagent.output_path, subagent.content);
    })
  );

  writeStdout(
    rendered_subagents.map(subagent => `installed ${subagent.output_path}`).join("\n") + "\n"
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

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  writeStderr(`install-subagents: ${message}\n${USAGE}`);
  process.exitCode = 1;
}
