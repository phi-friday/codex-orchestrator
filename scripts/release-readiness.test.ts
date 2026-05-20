import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "bun:test";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const PACKAGE_JSON_PATH = resolve(REPO_ROOT, "package.json");
const RELEASE_WORKFLOW_PATH = resolve(REPO_ROOT, ".github/workflows/release-verification.yml");
const RUNTIME_ENTRY_FIELDS = ["main", "module", "exports", "bin"] as const;

type RuntimeEntryField = (typeof RUNTIME_ENTRY_FIELDS)[number];

type PackageJson = Partial<Record<RuntimeEntryField, unknown>> & {
  scripts?: Record<string, string>;
};

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as PackageJson;
}

function collectRuntimeEntryPaths(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(entry => collectRuntimeEntryPaths(entry));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(entry => collectRuntimeEntryPaths(entry));
  }

  return [];
}

test("root package runtime entry metadata is absent or points to existing files", (): void => {
  const package_json = readPackageJson();

  for (const field of RUNTIME_ENTRY_FIELDS) {
    for (const entry_path of collectRuntimeEntryPaths(package_json[field])) {
      expect(existsSync(resolve(REPO_ROOT, entry_path)), `${field}: ${entry_path}`).toBe(true);
    }
  }
});

test("documented package scripts do not depend on jq", (): void => {
  const package_json = readPackageJson();
  const scripts = package_json.scripts ?? {};

  expect(Object.entries(scripts).filter(([_name, command]) => /\bjq\b/u.test(command))).toEqual([]);
});

test("release verification workflow runs the public release command set", (): void => {
  const workflow = readFileSync(RELEASE_WORKFLOW_PATH, "utf8");

  expect(workflow).toContain("bun run test");
  expect(workflow).toContain("bun run typecheck");
  expect(workflow).toContain("bun run lint");
  expect(workflow).toContain("bun run version:check");
});

test("marketplace smoke command includes explicit target directory", (): void => {
  const readme = readFileSync(resolve(REPO_ROOT, "README.md"), "utf8");

  expect(readme).toContain("hooks/hooks.json");
  expect(readme).toContain("node scripts/install-subagents.mjs");
  expect(readme).toContain("--config /tmp/codex-orchestrator-smoke.json");
  expect(readme).toContain("--target-dir /tmp/codex-orchestrator-smoke-agents");
  expect(readme).not.toContain("node plugins/codex-orchestrator/scripts/install-subagents.mjs");
});
