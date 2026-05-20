import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "bun:test";

import type { FileSystem } from "./version.ts";
import {
  bumpVersionFiles,
  checkVersionFiles,
  computeTargetVersion,
  parseStableVersion,
  renderTemplate,
} from "./version.ts";

type Fixture = {
  cleanup: () => Promise<void>;
  cwd: string;
};

type RunResult = {
  code: number;
  stderr: string;
  stdout: string;
};

type ExecFileError = Error & {
  code?: number | string;
  stderr?: string;
  stdout?: string;
};

const execFileAsync = promisify(execFile);
const BUN_EXECUTABLE = Bun.which("bun") ?? "bun";
const REPO_ROOT = resolve(import.meta.dirname, "..");

function englishTemplate(): string {
  return "Install with `codex plugin marketplace add phi-friday/codex-orchestrator --ref v{{VERSION}}`.\n";
}

function koreanTemplate(): string {
  return "설치: `codex plugin marketplace add phi-friday/codex-orchestrator --ref v{{VERSION}}`.\n";
}

function renderFixtureReadme(template: string, version: string): string {
  return template.replaceAll("{{VERSION}}", version);
}

async function createFixture(version = "1.2.3"): Promise<Fixture> {
  const root_dir = await mkdtemp(join(tmpdir(), "codex-orchestrator-version-"));
  const cwd = join(root_dir, "repo");

  await mkdir(join(cwd, "plugins/codex-orchestrator/.codex-plugin"), { recursive: true });
  await mkdir(join(cwd, "docs/templates"), { recursive: true });
  await writeFile(
    join(cwd, "plugins/codex-orchestrator/.codex-plugin/plugin.json"),
    `{\n  "name": "codex-orchestrator",\n  "version": "${version}"\n}\n`,
    "utf8"
  );
  await writeFile(join(cwd, "docs/templates/README.md"), englishTemplate(), "utf8");
  await writeFile(join(cwd, "docs/templates/README.kr.md"), koreanTemplate(), "utf8");
  await writeFile(
    join(cwd, "README.md"),
    renderFixtureReadme(englishTemplate(), version),
    "utf8"
  );
  await writeFile(
    join(cwd, "README.kr.md"),
    renderFixtureReadme(koreanTemplate(), version),
    "utf8"
  );

  return {
    cleanup: async (): Promise<void> => {
      await rm(root_dir, { force: true, recursive: true });
    },
    cwd,
  };
}

async function runBun(args: string[]): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFileAsync(BUN_EXECUTABLE, args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });

    return {
      code: 0,
      stderr,
      stdout,
    };
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    const exec_error = error as ExecFileError;

    return {
      code: typeof exec_error.code === "number" ? exec_error.code : 1,
      stderr: exec_error.stderr ?? "",
      stdout: exec_error.stdout ?? "",
    };
  }
}

test("parses stable semver and rejects unsupported versions", (): void => {
  expect(parseStableVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  expect(parseStableVersion("0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
  expect((): void => {
    parseStableVersion("1.2");
  }).toThrow("stable MAJOR.MINOR.PATCH");
  expect((): void => {
    parseStableVersion("1.2.3-beta.1");
  }).toThrow("stable MAJOR.MINOR.PATCH");
  expect((): void => {
    parseStableVersion("01.2.3");
  }).toThrow("stable MAJOR.MINOR.PATCH");
});

test("computes target versions for exact and increment inputs", (): void => {
  expect(computeTargetVersion("1.2.3", "patch")).toBe("1.2.4");
  expect(computeTargetVersion("1.2.3", "minor")).toBe("1.3.0");
  expect(computeTargetVersion("1.2.3", "major")).toBe("2.0.0");
  expect(computeTargetVersion("1.2.3", "0.2.0")).toBe("0.2.0");
  expect((): void => {
    computeTargetVersion("1.2.3", "latest");
  }).toThrow("stable MAJOR.MINOR.PATCH");
});

test("renders templates and requires the version placeholder", (): void => {
  expect(renderTemplate("release v{{VERSION}}\n", "2.0.0", "README.md")).toBe(
    "release v2.0.0\n"
  );
  expect((): void => {
    renderTemplate("release main\n", "2.0.0", "README.md");
  }).toThrow("must contain {{VERSION}}");
});

test("checks generated README files for drift without modifying files", async (): Promise<void> => {
  const fixture = await createFixture();

  try {
    expect(await checkVersionFiles(fixture.cwd)).toEqual({ drift_paths: [] });

    const readme_path = join(fixture.cwd, "README.md");
    const before_drift = await readFile(readme_path, "utf8");

    await writeFile(readme_path, `${before_drift}manual edit\n`, "utf8");
    expect(await checkVersionFiles(fixture.cwd)).toEqual({ drift_paths: ["README.md"] });
    expect(await readFile(readme_path, "utf8")).toBe(`${before_drift}manual edit\n`);
  } finally {
    await fixture.cleanup();
  }
});

test("bumps plugin version and regenerates README files", async (): Promise<void> => {
  const fixture = await createFixture("1.2.3");

  try {
    const result = await bumpVersionFiles("minor", fixture.cwd);

    expect(result).toEqual({
      from_version: "1.2.3",
      to_version: "1.3.0",
    });
    expect(
      await readFile(
        join(fixture.cwd, "plugins/codex-orchestrator/.codex-plugin/plugin.json"),
        "utf8"
      )
    ).toContain('"version": "1.3.0"');
    expect(await readFile(join(fixture.cwd, "README.md"), "utf8")).toContain("--ref v1.3.0");
    expect(await readFile(join(fixture.cwd, "README.md"), "utf8")).not.toContain("--ref main");
    expect(await readFile(join(fixture.cwd, "README.kr.md"), "utf8")).toContain("--ref v1.3.0");
  } finally {
    await fixture.cleanup();
  }
});

test("rolls back touched files when a later write fails", async (): Promise<void> => {
  const fixture = await createFixture("1.2.3");
  const plugin_path = join(fixture.cwd, "plugins/codex-orchestrator/.codex-plugin/plugin.json");
  const readme_path = join(fixture.cwd, "README.md");
  const readme_kr_path = join(fixture.cwd, "README.kr.md");

  try {
    const original_plugin = await readFile(plugin_path, "utf8");
    const original_readme = await readFile(readme_path, "utf8");
    const original_readme_kr = await readFile(readme_kr_path, "utf8");
    let write_count = 0;
    const file_system: FileSystem = {
      readFile,
      writeFile: async (path: string, data: string, encoding: BufferEncoding): Promise<void> => {
        write_count += 1;

        if (write_count === 3) {
          throw new Error(`Injected write failure for ${path}`);
        }

        await writeFile(path, data, encoding);
      },
    };

    try {
      await bumpVersionFiles("patch", fixture.cwd, file_system);
      throw new Error("Expected bumpVersionFiles to reject.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Injected write failure");
    }
    expect(await readFile(plugin_path, "utf8")).toBe(original_plugin);
    expect(await readFile(readme_path, "utf8")).toBe(original_readme);
    expect(await readFile(readme_kr_path, "utf8")).toBe(original_readme_kr);
  } finally {
    await fixture.cleanup();
  }
});

test("package script bumps version against an explicit repository root", async (): Promise<void> => {
  const fixture = await createFixture("1.2.3");

  try {
    const result = await runBun(["run", "version", "patch", "--repo-root", fixture.cwd]);

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("bun scripts/version.ts patch --repo-root");
    expect(result.stdout).toContain("Updated plugin version 1.2.3 -> 1.2.4");
    expect(await readFile(join(fixture.cwd, "README.md"), "utf8")).toContain("--ref v1.2.4");
  } finally {
    await fixture.cleanup();
  }
});

test("package check script reports drift without modifying files", async (): Promise<void> => {
  const fixture = await createFixture("1.2.3");
  const readme_path = join(fixture.cwd, "README.md");

  try {
    const original_readme = await readFile(readme_path, "utf8");
    await writeFile(readme_path, `${original_readme}drift\n`, "utf8");
    const result = await runBun(["run", "version:check", "--repo-root", fixture.cwd]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Generated files are out of date: README.md");
    expect(await readFile(readme_path, "utf8")).toBe(`${original_readme}drift\n`);
  } finally {
    await fixture.cleanup();
  }
});
