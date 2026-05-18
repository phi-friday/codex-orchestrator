import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "bun:test";

type RunResult = {
  code: number;
  stderr: string;
  stdout: string;
};

type Fixture = {
  cleanup: () => Promise<void>;
  cwd: string;
  home: string;
};

type ExecFileError = Error & {
  code?: number | string;
  stderr?: string;
  stdout?: string;
};

const execFileAsync = promisify(execFile);
const NODE_EXECUTABLE = Bun.which("node") ?? "node";
const SCRIPT_PATH = resolve(import.meta.dirname, "install-subagents.mjs");

async function runInstaller(args: string[], cwd: string, home: string): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFileAsync(NODE_EXECUTABLE, [SCRIPT_PATH, ...args], {
      cwd,
      encoding: "utf8",
      env: {
        HOME: home,
      },
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

async function createFixture(prefix: string): Promise<Fixture> {
  const root_dir = await mkdtemp(join(tmpdir(), prefix));
  const cwd = join(root_dir, "repo");
  const home = join(root_dir, "home");

  await mkdir(cwd, { recursive: true });
  await mkdir(home, { recursive: true });

  return {
    cleanup: async (): Promise<void> => {
      await rm(root_dir, { force: true, recursive: true });
    },
    cwd,
    home,
  };
}

async function writeJson(path: string, config: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2), "utf8");
}

async function expectRejectsCode(promise: Promise<unknown>, code: string): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected promise to reject with code ${code}.`);
  } catch (error) {
    expect(error).toHaveProperty("code", code);
  }
}

test("rejects removed --model option", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-model-");

  try {
    const result = await runInstaller(["--model", "gpt-5.4"], fixture.cwd, fixture.home);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/Unknown option '--model'/u);
  } finally {
    await fixture.cleanup();
  }
});

test("merges config precedence and lets null disable inherited agents", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-merge-");
  const target_dir = join(fixture.cwd, "agents");
  const explicit_config = join(fixture.cwd, "explicit.json");

  try {
    await writeJson(join(fixture.home, ".codex", "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4",
        },
        "implementation-worker": {
          model: "gpt-5.4",
        },
      },
    });
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4-codex",
        },
      },
    });
    await writeJson(explicit_config, {
      agents: {
        "implementation-worker": {
          model: null,
        },
      },
    });

    const result = await runInstaller(
      ["--config", explicit_config, "--target-dir", target_dir],
      fixture.cwd,
      fixture.home
    );

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(await readFile(join(target_dir, "codebase-explorer.yaml"), "utf8")).toMatch(
      /gpt-5\.4-codex/u
    );
    await expectRejectsCode(
      readFile(join(target_dir, "implementation-worker.yaml"), "utf8"),
      "ENOENT"
    );
  } finally {
    await fixture.cleanup();
  }
});

test("inherits lower-priority model when higher-priority agent has no model field", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-field-merge-");

  try {
    await writeJson(join(fixture.home, ".codex", "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4",
        },
      },
    });
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {},
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(
      await readFile(join(fixture.cwd, ".codex", "agents", "codebase-explorer.yaml"), "utf8")
    ).toMatch(/gpt-5\.4/u);
  } finally {
    await fixture.cleanup();
  }
});

test("defaults repository config installs to the repository agent directory", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-repo-default-");

  try {
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4-codex",
        },
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(
      await readFile(join(fixture.cwd, ".codex", "agents", "codebase-explorer.yaml"), "utf8")
    ).toMatch(/gpt-5\.4-codex/u);
  } finally {
    await fixture.cleanup();
  }
});

test("defaults global-only config installs to the global agent directory", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-global-default-");

  try {
    await writeJson(join(fixture.home, ".codex", "codex-orchestrator.json"), {
      agents: {
        "implementation-worker": {
          model: "gpt-5.4",
        },
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(
      await readFile(join(fixture.home, ".codex", "agents", "implementation-worker.yaml"), "utf8")
    ).toMatch(/gpt-5\.4/u);
  } finally {
    await fixture.cleanup();
  }
});

test("fails without any configuration", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-missing-config-");

  try {
    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/No Codex Orchestrator configuration found/u);
  } finally {
    await fixture.cleanup();
  }
});

test("requires target directory for explicit config", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-explicit-target-");
  const explicit_config = join(fixture.cwd, "explicit.json");

  try {
    await writeJson(explicit_config, {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4",
        },
      },
    });

    const result = await runInstaller(["--config", explicit_config], fixture.cwd, fixture.home);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/--target-dir is required when --config is provided/u);
  } finally {
    await fixture.cleanup();
  }
});

test("dry-run reports planned writes and removals without modifying files", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-dry-run-");
  const target_dir = join(fixture.cwd, "agents");

  try {
    await mkdir(target_dir, { recursive: true });
    await writeFile(join(target_dir, "implementation-worker.yaml"), "existing", "utf8");
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "codebase-explorer": {
          model: "gpt-5.4",
        },
        "implementation-worker": {
          model: null,
        },
      },
    });

    const result = await runInstaller(
      ["--target-dir", target_dir, "--dry-run"],
      fixture.cwd,
      fixture.home
    );

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/\[dry-run\] write .*codebase-explorer\.yaml/u);
    expect(result.stdout).toMatch(/\[dry-run\] remove .*implementation-worker\.yaml/u);
    expect(await readFile(join(target_dir, "implementation-worker.yaml"), "utf8")).toBe("existing");
  } finally {
    await fixture.cleanup();
  }
});
