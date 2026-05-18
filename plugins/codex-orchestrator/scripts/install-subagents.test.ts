import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "bun:test";
import {
  mergeConfigAgents,
  parseOptions,
  readTemplate,
  renderTemplate,
  resolveTargetDir,
} from "./install-subagents.mjs";

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

test("exports focused installer utilities without running the CLI", (): void => {
  expect(parseOptions).toBeFunction();
  expect(mergeConfigAgents).toBeFunction();
  expect(resolveTargetDir).toBeFunction();
  expect(readTemplate).toBeFunction();
  expect(renderTemplate).toBeFunction();
});

test("parses options and expands configured paths", (): void => {
  const options = parseOptions([
    "--config",
    "~/codex-orchestrator.json",
    "--target-dir",
    "~/agents",
    "--asset-dir",
    "~/templates",
    "--dry-run",
  ]);

  expect(options.config_path).toEndWith("/codex-orchestrator.json");
  expect(options.target_dir).toEndWith("/agents");
  expect(options.asset_dir).toEndWith("/templates");
  expect(options.dry_run).toBe(true);
  expect(options.help).toBe(false);
});

test("requires a target directory when parsing explicit config options", (): void => {
  expect((): void => {
    parseOptions(["--config", "codex-orchestrator.json"]);
  }).toThrow("--target-dir is required when --config is provided.");
});

test("merges config agents and validates model values", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unit-merge-");
  const global_config = join(fixture.cwd, "global.json");
  const repository_config = join(fixture.cwd, "repository.json");
  const explicit_config = join(fixture.cwd, "explicit.json");
  const invalid_config = join(fixture.cwd, "invalid.json");

  try {
    await writeJson(global_config, {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4",
        },
        fixer: {
          model: "gpt-5.4",
        },
      },
    });
    await writeJson(repository_config, {
      agents: {
        "orchestrator-explorer": {},
      },
    });
    await writeJson(explicit_config, {
      agents: {
        fixer: {
          model: null,
        },
      },
    });
    await writeJson(invalid_config, {
      agents: {
        broken: {
          model: 5,
        },
      },
    });

    const merged_agents = await mergeConfigAgents([
      { kind: "global", path: global_config },
      { kind: "repository", path: repository_config },
      { kind: "explicit", path: explicit_config },
    ]);

    expect(merged_agents).toEqual({
      "orchestrator-explorer": {
        model: "gpt-5.4",
      },
      fixer: {
        model: null,
      },
    });

    try {
      await mergeConfigAgents([{ kind: "global", path: invalid_config }]);
      throw new Error("Expected invalid model config to reject.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Agent model must be a string or null/u);
    }
  } finally {
    await fixture.cleanup();
  }
});

test("resolves target directories from explicit, repository, and global sources", (): void => {
  const configured_target_dir = resolve("custom-agents");

  expect(resolveTargetDir(configured_target_dir, [])).toBe(configured_target_dir);
  expect(
    resolveTargetDir(undefined, [
      { kind: "global", path: "/tmp/global.json" },
      { kind: "repository", path: "/tmp/repository.json" },
    ])
  ).toBe(resolve(".codex", "agents"));
  expect(resolveTargetDir(undefined, [{ kind: "global", path: "/tmp/global.json" }])).toEndWith(
    "/.codex/agents"
  );
});

test("reads template names and renders model tokens", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unit-template-");
  const template_path = join(fixture.cwd, "worker.toml");

  try {
    await writeFile(template_path, 'name = "fixer"\nmodel = "{{MODEL}}"\n', "utf8");

    const template = await readTemplate(template_path);

    expect(template.agent_name).toBe("fixer");
    expect(template.output_name).toBe("worker.toml");
    expect(renderTemplate(template.content, "gpt-5.4")).toBe('name = "fixer"\nmodel = "gpt-5.4"\n');
  } finally {
    await fixture.cleanup();
  }
});

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
        "orchestrator-explorer": {
          model: "gpt-5.4",
        },
        fixer: {
          model: "gpt-5.4",
        },
      },
    });
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4-codex",
        },
      },
    });
    await writeJson(explicit_config, {
      agents: {
        fixer: {
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
    expect(await readFile(join(target_dir, "orchestrator-explorer.toml"), "utf8")).toMatch(
      /gpt-5\.4-codex/u
    );
    await expectRejectsCode(readFile(join(target_dir, "fixer.toml"), "utf8"), "ENOENT");
  } finally {
    await fixture.cleanup();
  }
});

test("inherits lower-priority model when higher-priority agent has no model field", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-field-merge-");

  try {
    await writeJson(join(fixture.home, ".codex", "codex-orchestrator.json"), {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4",
        },
      },
    });
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "orchestrator-explorer": {},
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(
      await readFile(join(fixture.cwd, ".codex", "agents", "orchestrator-explorer.toml"), "utf8")
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
        "orchestrator-explorer": {
          model: "gpt-5.4-codex",
        },
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(
      await readFile(join(fixture.cwd, ".codex", "agents", "orchestrator-explorer.toml"), "utf8")
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
        fixer: {
          model: "gpt-5.4",
        },
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(await readFile(join(fixture.home, ".codex", "agents", "fixer.toml"), "utf8")).toMatch(
      /gpt-5\.4/u
    );
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
        "orchestrator-explorer": {
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
    await writeFile(join(target_dir, "fixer.toml"), "existing", "utf8");
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4",
        },
        fixer: {
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
    expect(result.stdout).toMatch(/\[dry-run\] write .*orchestrator-explorer\.toml/u);
    expect(result.stdout).toMatch(/\[dry-run\] remove .*fixer\.toml/u);
    expect(await readFile(join(target_dir, "fixer.toml"), "utf8")).toBe("existing");
  } finally {
    await fixture.cleanup();
  }
});

test("discovers bundled TOML templates and includes Codex custom agent fields", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-bundled-");

  try {
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        designer: {
          model: "gpt-5.4",
        },
        fixer: {
          model: "gpt-5.4-mini",
        },
        librarian: {
          model: "gpt-5.4-mini",
        },
        observer: {
          model: "gpt-5.4-mini",
        },
        oracle: {
          model: "gpt-5.5",
        },
        "orchestrator-explorer": {
          model: "gpt-5.4-mini",
        },
      },
    });

    const result = await runInstaller([], fixture.cwd, fixture.home);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");

    const output_dir = join(fixture.cwd, ".codex", "agents");
    const expected_agents = [
      "designer",
      "fixer",
      "librarian",
      "observer",
      "oracle",
      "orchestrator-explorer",
    ];

    const rendered_agents = await Promise.all(
      expected_agents.map(async agent_name => ({
        agent_name,
        content: await readFile(join(output_dir, `${agent_name}.toml`), "utf8"),
      }))
    );

    for (const { agent_name, content } of rendered_agents) {
      expect(content).toContain(`name = "${agent_name}"`);
      expect(content).toContain("description = ");
      expect(content).toContain("model = ");
      expect(content).toContain("model_reasoning_effort = ");
      expect(content).toContain("developer_instructions = ");
      expect(content).toContain("Derived from oh-my-opencode-slim 1.1.1");
      expect(content).toContain("Source repository: https://github.com/alvinunreal/oh-my-opencode-slim");
      expect(content).toContain("Source commit: f6b3990de1551b101416154812508e64e2f2d0ca");
      expect(content).toContain(
        "Adaptation: OpenCode-specific tools and permissions translated for Codex custom agents."
      );
    }

    const librarian = await readFile(join(output_dir, "librarian.toml"), "utf8");

    expect(librarian).toContain("[mcp_servers.context7]");
    expect(librarian).toContain('url = "https://mcp.context7.com/mcp"');
  } finally {
    await fixture.cleanup();
  }
});
