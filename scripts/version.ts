#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const PLUGIN_JSON_PATH = "plugins/codex-orchestrator/.codex-plugin/plugin.json";
const README_PATH = "README.md";
const README_KR_PATH = "README.kr.md";
const README_TEMPLATE_PATH = "docs/templates/README.md";
const README_KR_TEMPLATE_PATH = "docs/templates/README.kr.md";
const VERSION_PLACEHOLDER = "{{VERSION}}";

type VersionCommand = string;
type ReadFile = (path: string, encoding: BufferEncoding) => Promise<string>;
type WriteFile = (path: string, data: string, encoding: BufferEncoding) => Promise<void>;

export interface FileSystem {
  readFile: ReadFile;
  writeFile: WriteFile;
}

const DEFAULT_FILE_SYSTEM: FileSystem = { readFile, writeFile };

export interface VersionPaths {
  plugin_json_path: string;
  readme_path: string;
  readme_kr_path: string;
  readme_template_path: string;
  readme_kr_template_path: string;
}

export interface StableVersion {
  major: number;
  minor: number;
  patch: number;
}

interface VersionedPluginJson {
  version: string;
}

interface RenderedReadmes {
  readme: string;
  readme_kr: string;
}

interface VersionFileContents {
  plugin_json: string;
  readme: string;
  readme_kr: string;
}

export interface CheckResult {
  drift_paths: string[];
}

export interface BumpResult {
  from_version: string;
  to_version: string;
}

export function getVersionPaths(repo_root = REPO_ROOT): VersionPaths {
  return {
    plugin_json_path: resolve(repo_root, PLUGIN_JSON_PATH),
    readme_path: resolve(repo_root, README_PATH),
    readme_kr_path: resolve(repo_root, README_KR_PATH),
    readme_template_path: resolve(repo_root, README_TEMPLATE_PATH),
    readme_kr_template_path: resolve(repo_root, README_KR_TEMPLATE_PATH),
  };
}

export function parseStableVersion(version: string): StableVersion {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.exec(version);

  if (!match) {
    throw new TypeError(`Expected a stable MAJOR.MINOR.PATCH version, got '${version}'.`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function formatStableVersion(version: StableVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function computeTargetVersion(current_version: string, command: VersionCommand): string {
  const current = parseStableVersion(current_version);

  switch (command) {
    case "major":
      return formatStableVersion({ major: current.major + 1, minor: 0, patch: 0 });
    case "minor":
      return formatStableVersion({ major: current.major, minor: current.minor + 1, patch: 0 });
    case "patch":
      return formatStableVersion({
        major: current.major,
        minor: current.minor,
        patch: current.patch + 1,
      });
    default:
      parseStableVersion(command);
      return command;
  }
}

export function renderTemplate(template: string, version: string, template_path: string): string {
  if (!template.includes(VERSION_PLACEHOLDER)) {
    throw new Error(`${template_path} must contain ${VERSION_PLACEHOLDER}.`);
  }

  return template.replaceAll(VERSION_PLACEHOLDER, version);
}

export function readPluginVersion(plugin_json_text: string): string {
  const parsed = JSON.parse(plugin_json_text) as Partial<VersionedPluginJson>;

  if (typeof parsed.version !== "string" || parsed.version.length === 0) {
    throw new TypeError(`${PLUGIN_JSON_PATH} must contain a non-empty string version.`);
  }

  parseStableVersion(parsed.version);
  return parsed.version;
}

export function replacePluginVersion(plugin_json_text: string, version: string): string {
  parseStableVersion(version);
  readPluginVersion(plugin_json_text);

  return plugin_json_text.replace(
    /("version"\s*:\s*)"[^"]+"/u,
    `$1${JSON.stringify(version)}`
  );
}

async function ensureParentDirectories(paths: string[]): Promise<void> {
  await Promise.all(paths.map(path => mkdir(dirname(path), { recursive: true })));
}

async function waitForWrites(writes: Array<Promise<void>>, label: string): Promise<void> {
  const results = await Promise.allSettled(writes);
  const failed = results.find(result => result.status === "rejected");

  if (failed?.status === "rejected") {
    throw new Error(`${label} failed: ${String(failed.reason)}`, { cause: failed.reason });
  }
}

async function readVersionFileContents(
  paths: VersionPaths,
  file_system: FileSystem
): Promise<VersionFileContents> {
  const [plugin_json, readme, readme_kr] = await Promise.all([
    file_system.readFile(paths.plugin_json_path, "utf8"),
    file_system.readFile(paths.readme_path, "utf8"),
    file_system.readFile(paths.readme_kr_path, "utf8"),
  ]);

  return {
    plugin_json,
    readme,
    readme_kr,
  };
}

async function renderReadmes(
  paths: VersionPaths,
  version: string,
  file_system: FileSystem
): Promise<RenderedReadmes> {
  const [readme_template, readme_kr_template] = await Promise.all([
    file_system.readFile(paths.readme_template_path, "utf8"),
    file_system.readFile(paths.readme_kr_template_path, "utf8"),
  ]);

  return {
    readme: renderTemplate(readme_template, version, paths.readme_template_path),
    readme_kr: renderTemplate(readme_kr_template, version, paths.readme_kr_template_path),
  };
}

async function restoreVersionFileContents(
  paths: VersionPaths,
  contents: VersionFileContents,
  file_system: FileSystem
): Promise<void> {
  await waitForWrites(
    [
      file_system.writeFile(paths.plugin_json_path, contents.plugin_json, "utf8"),
      file_system.writeFile(paths.readme_path, contents.readme, "utf8"),
      file_system.writeFile(paths.readme_kr_path, contents.readme_kr, "utf8"),
    ],
    "Rollback"
  );
}

async function writeVersionFiles(
  paths: VersionPaths,
  plugin_json: string,
  readmes: RenderedReadmes,
  file_system: FileSystem
): Promise<void> {
  await ensureParentDirectories([paths.plugin_json_path, paths.readme_path, paths.readme_kr_path]);
  await waitForWrites(
    [
      file_system.writeFile(paths.plugin_json_path, plugin_json, "utf8"),
      file_system.writeFile(paths.readme_path, readmes.readme, "utf8"),
      file_system.writeFile(paths.readme_kr_path, readmes.readme_kr, "utf8"),
    ],
    "Version file write"
  );
}

export async function checkVersionFiles(
  repo_root = REPO_ROOT,
  file_system: FileSystem = DEFAULT_FILE_SYSTEM
): Promise<CheckResult> {
  const paths = getVersionPaths(repo_root);
  const current = await readVersionFileContents(paths, file_system);
  const version = readPluginVersion(current.plugin_json);
  const expected = await renderReadmes(paths, version, file_system);
  const drift_paths: string[] = [];

  if (current.readme !== expected.readme) {
    drift_paths.push(README_PATH);
  }

  if (current.readme_kr !== expected.readme_kr) {
    drift_paths.push(README_KR_PATH);
  }

  return { drift_paths };
}

export async function bumpVersionFiles(
  target: string,
  repo_root = REPO_ROOT,
  file_system: FileSystem = DEFAULT_FILE_SYSTEM
): Promise<BumpResult> {
  const paths = getVersionPaths(repo_root);
  const original = await readVersionFileContents(paths, file_system);
  const from_version = readPluginVersion(original.plugin_json);
  const to_version = computeTargetVersion(from_version, target);
  const plugin_json = replacePluginVersion(original.plugin_json, to_version);
  const readmes = await renderReadmes(paths, to_version, file_system);

  try {
    await writeVersionFiles(paths, plugin_json, readmes, file_system);
  } catch (error) {
    try {
      await restoreVersionFileContents(paths, original, file_system);
    } catch (restore_error) {
      throw new Error(
        `Version bump failed and rollback failed: ${String(error)}; rollback: ${String(
          restore_error
        )}`,
        { cause: restore_error }
      );
    }

    throw error;
  }

  return {
    from_version,
    to_version,
  };
}

export function getUsage(): string {
  return [
    "Usage: bun run version <major|minor|patch|MAJOR.MINOR.PATCH>",
    "       bun run version:check",
    "       bun scripts/version.ts --repo-root <path> <target>",
    "",
    "Updates plugin.json version and regenerates README files from docs/templates.",
  ].join("\n");
}

async function main(): Promise<void> {
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv.slice(2),
      allowPositionals: true,
      options: {
        check: {
          type: "boolean",
          default: false,
        },
        "repo-root": {
          type: "string",
          default: REPO_ROOT,
        },
      },
      strict: true,
    });
    const repo_root = values["repo-root"];

    if (typeof repo_root !== "string" || repo_root.length === 0) {
      throw new Error("--repo-root must be a non-empty string.");
    }

    if (values.check) {
      if (positionals.length > 0) {
        throw new Error("--check does not accept a version target.");
      }

      const result = await checkVersionFiles(repo_root);

      if (result.drift_paths.length > 0) {
        throw new Error(`Generated files are out of date: ${result.drift_paths.join(", ")}`);
      }

      process.stdout.write("Version-generated files are up to date.\n");
      return;
    }

    const [target, ...extra_positionals] = positionals;

    if (!target || extra_positionals.length > 0) {
      throw new Error("Expected exactly one version target.");
    }

    const result = await bumpVersionFiles(target, repo_root);
    process.stdout.write(`Updated plugin version ${result.from_version} -> ${result.to_version}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`version: ${message}\n\n${getUsage()}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main();
}
