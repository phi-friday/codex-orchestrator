#!/usr/bin/env bun

import { $ } from "bun";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_REPO_URL = "https://github.com/alvinunreal/oh-my-opencode-slim.git";
const DEFAULT_REFERENCE_DIR = "references/oh-my-opencode-slim";
const REFERENCE_ENTRY_NAMES = [
  "src",
  "package.json",
  "LICENSE",
  "AGENTS.md",
  "README.md",
  "codemap.md",
] as const;
const REPO_ROOT = resolve(import.meta.dirname, "..");

type ParsedValue = string | boolean | string[] | boolean[] | undefined;

interface ReferenceCliOptions {
  help: boolean;
  repo_url: string;
  version?: string;
  reference_dir: string;
}

interface PackageJsonMetadata {
  homepage?: string;
  license?: string;
  name?: string;
  repository?: string | { type?: string; url?: string };
  version?: string;
}

interface RootPackageJson {
  references?: {
    "oh-my-opencode-slim"?: {
      version?: string;
    };
  };
}

interface ThirdPartyNoticeInput {
  license_text: string;
  package_json: PackageJsonMetadata;
  reference_dir: string;
}

export function getUsage(): string {
  return [
    "Usage: bun run reference:oh-my-opencode-slim [options]",
    "",
    "Clones a tagged git repository and stores its contents as reference material.",
    "",
    "Options:",
    "  -v, --version <version>     Repository version tag without the leading v.",
    "                              Defaults to package.json references.oh-my-opencode-slim.version.",
    `  -r, --repo <url>            Git repository URL. Default: ${DEFAULT_REPO_URL}`,
    `      --reference-dir <path>  Output directory. Default: ${DEFAULT_REFERENCE_DIR}`,
    "  -h, --help                  Show this help.",
  ].join("\n");
}

function readStringOption(value: ParsedValue, option_name: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new TypeError(`${option_name} must be a non-empty string`);
}

function readBooleanOption(value: ParsedValue): boolean {
  return value === true;
}

export function parseReferenceCliArgs(args: string[]): ReferenceCliOptions {
  const { values } = parseArgs({
    args,
    allowPositionals: false,
    options: {
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
      repo: {
        type: "string",
        short: "r",
        default: DEFAULT_REPO_URL,
      },
      version: {
        type: "string",
        short: "v",
      },
      "reference-dir": {
        type: "string",
        default: DEFAULT_REFERENCE_DIR,
      },
    },
    strict: true,
  });

  const help = readBooleanOption(values.help);

  return {
    help,
    repo_url: readStringOption(values.repo, "--repo"),
    version:
      typeof values.version === "string" ? readStringOption(values.version, "--version") : undefined,
    reference_dir: readStringOption(values["reference-dir"], "--reference-dir"),
  };
}

export function resolveReferenceOptions(
  options: ReferenceCliOptions,
  package_json_text: string
): Required<ReferenceCliOptions> {
  if (options.help) {
    return { ...options, version: "" };
  }

  const package_json = JSON.parse(package_json_text) as RootPackageJson;
  const package_version = package_json.references?.["oh-my-opencode-slim"]?.version;
  const version = options.version ?? package_version;

  if (typeof version !== "string" || version.length === 0) {
    throw new TypeError(
      "package.json references.oh-my-opencode-slim.version must be a non-empty string"
    );
  }

  return {
    ...options,
    version,
  };
}

export function getGitCloneArgs(options: ReferenceCliOptions, destination: string): string[] {
  const version = readStringOption(options.version, "--version");

  return [
    "git",
    "clone",
    "--depth",
    "1",
    "--branch",
    `v${version}`,
    options.repo_url,
    destination,
  ];
}

export function getReferenceEntryNames(): string[] {
  return [...REFERENCE_ENTRY_NAMES];
}

function readPackageSource(package_json: PackageJsonMetadata): string {
  const { repository } = package_json;

  if (typeof repository === "string" && repository.length > 0) {
    return repository;
  }

  if (typeof repository === "object" && repository?.url && repository.url.length > 0) {
    return repository.url;
  }

  if (package_json.homepage && package_json.homepage.length > 0) {
    return package_json.homepage;
  }

  return "Unknown";
}

export function buildThirdPartyNotice(input: ThirdPartyNoticeInput): string {
  const package_name = input.package_json.name ?? "oh-my-opencode-slim";
  const package_version = input.package_json.version ?? "Unknown";
  const license_name = input.package_json.license ?? "Unknown";

  return `# Third-Party Notices

This repository includes code from the following third-party projects.

## ${package_name}

Version: ${package_version}
Source: ${readPackageSource(input.package_json)}
License: ${license_name}
Reference path: \`${input.reference_dir}\`

The upstream license text is reproduced below.

\`\`\`text
${input.license_text.trimEnd()}
\`\`\`
`;
}

async function writeThirdPartyNotice(
  reference_dir: string,
  relative_reference_dir: string
): Promise<void> {
  const [package_json_text, license_text] = await Promise.all([
    readFile(join(reference_dir, "package.json"), "utf8"),
    readFile(join(reference_dir, "LICENSE"), "utf8"),
  ]);
  const package_json = JSON.parse(package_json_text) as PackageJsonMetadata;
  const notice_text = buildThirdPartyNotice({
    license_text,
    package_json,
    reference_dir: relative_reference_dir,
  });

  await writeFile(resolve(REPO_ROOT, "THIRD_PARTY_NOTICES.md"), notice_text);
}

async function copyReferenceEntries(clone_dir: string, reference_dir: string): Promise<void> {
  await mkdir(reference_dir, { recursive: true });

  await Promise.all(
    REFERENCE_ENTRY_NAMES.map(entry_name =>
      cp(join(clone_dir, entry_name), join(reference_dir, entry_name), { recursive: true })
    )
  );
}

export async function fetchReferencePackage(options: ReferenceCliOptions): Promise<void> {
  const temp_dir = await mkdtemp(join(tmpdir(), "codex-orchestrator-reference-"));
  const clone_dir = join(temp_dir, "repo");
  const reference_spec = `${options.repo_url}#v${options.version}`;
  const reference_dir = resolve(REPO_ROOT, options.reference_dir);

  try {
    await $`${getGitCloneArgs(options, clone_dir)}`;
    await mkdir(dirname(reference_dir), { recursive: true });
    await rm(reference_dir, { recursive: true, force: true });
    await copyReferenceEntries(clone_dir, reference_dir);
    await writeThirdPartyNotice(reference_dir, options.reference_dir);
    console.info(`Fetched reference ${reference_spec} to ${reference_dir}`);
  } finally {
    await rm(temp_dir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  try {
    const parsed_options = parseReferenceCliArgs(Bun.argv.slice(2));

    if (parsed_options.help) {
      console.info(getUsage());
      return;
    }

    const package_json_text = await readFile(resolve(REPO_ROOT, "package.json"), "utf8");
    const options = resolveReferenceOptions(parsed_options, package_json_text);

    await fetchReferencePackage(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`reference-oh-my-opencode-slim: ${message}\n\n${getUsage()}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main();
}
