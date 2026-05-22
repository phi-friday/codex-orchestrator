import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "bun:test";

type RuleValue = string | readonly unknown[];
type RuleMap = Record<string, RuleValue | undefined>;
type OverrideConfig = {
  files?: string[];
  rules?: RuleMap;
};
type LintConfig = {
  overrides?: OverrideConfig[];
  rules?: RuleMap;
};
type LintConfigModule = {
  default: LintConfig;
};

const REPO_ROOT = resolve(import.meta.dirname, "..");
const NON_HOOK_SCRIPT_DIRS = ["scripts", "plugins/codex-orchestrator/scripts"] as const;
const PROJECT_CODE_DIRS = ["scripts", "plugins/codex-orchestrator"] as const;
const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".ts"]);
const DIRECT_STDIO_WRITE_PATTERNS = [
  /\bprocess\.(?:stdout|stderr)\.write\s*\(/u,
  /(?:^|[^\w$.])(?:stdout|stderr)\.write\s*\(/u,
  /\b(?:\w+\.)?writeSync\s*\(\s*(?:1|2)\s*,/u,
] as const;

async function readLintConfig(): Promise<LintConfig> {
  const config_url = pathToFileURL(resolve(REPO_ROOT, "oxlint.config.ts")).href;
  const config_module = (await import(config_url)) as LintConfigModule;

  return config_module.default;
}

function getGlobalRule(config: LintConfig, rule_name: string): RuleValue | undefined {
  return config.rules?.[rule_name];
}

function getOverrides(config: LintConfig): OverrideConfig[] {
  return config.overrides ?? [];
}

function readProjectFiles(dirs: readonly string[]): { path: string; text: string }[] {
  return dirs.flatMap(dir => readFiles(resolve(REPO_ROOT, dir)));
}

function readFiles(dir: string): { path: string; text: string }[] {
  return readdirSync(dir).flatMap(entry_name => {
    const entry_path = join(dir, entry_name);
    const entry_stat = statSync(entry_path);

    if (entry_stat.isDirectory()) {
      return readFiles(entry_path);
    }

    if (
      entry_path.endsWith(".test.ts") ||
      !SOURCE_EXTENSIONS.has(entry_path.replace(/^.*(?=\.)/u, ""))
    ) {
      return [];
    }

    return [{ path: relative(REPO_ROOT, entry_path), text: readFileSync(entry_path, "utf8") }];
  });
}

test("eslint/no-console is globally off for non-hook scripts", async (): Promise<void> => {
  const lint_config = await readLintConfig();

  expect(getGlobalRule(lint_config, "eslint/no-console")).toBe("off");

  const ordinary_script_override = getOverrides(lint_config).find(override =>
    override.files?.includes("plugins/codex-orchestrator/scripts/**")
  );

  expect(ordinary_script_override?.rules?.["eslint/no-console"]).toBeUndefined();
});

test("eslint/no-console is an error for hook paths", async (): Promise<void> => {
  const lint_config = await readLintConfig();
  const hook_override = getOverrides(lint_config).find(override =>
    override.files?.includes("plugins/codex-orchestrator/hooks/**")
  );

  expect(hook_override?.rules?.["eslint/no-console"]).toBe("error");
});

test("non-hook scripts do not use direct stdout or stderr writes", (): void => {
  const violations = readProjectFiles(NON_HOOK_SCRIPT_DIRS)
    .filter(file => DIRECT_STDIO_WRITE_PATTERNS.some(pattern => pattern.test(file.text)))
    .map(file => file.path);

  expect(violations).toEqual([]);
});

test("project code does not use generic console output", (): void => {
  const violations = readProjectFiles(PROJECT_CODE_DIRS)
    .filter(file => /\bconsole\.log\b/u.test(file.text))
    .map(file => file.path);

  expect(violations).toEqual([]);
});
