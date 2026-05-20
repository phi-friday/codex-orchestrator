import { execFile } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "bun:test";
import {
  MANAGED_MARKER,
  escapeTomlBasicString,
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
const INSTALL_SUBAGENTS_SKILL_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "install-subagents",
  "SKILL.md"
);
const PLUGIN_METADATA_PATH = resolve(import.meta.dirname, "..", ".codex-plugin", "plugin.json");
const SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "assets",
  "schemas",
  "codex-orchestrator.schema.json"
);

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

async function expectRejectsMessage(promise: Promise<unknown>, pattern: RegExp): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected promise to reject with message ${pattern}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(pattern);
  }
}

test("exports focused installer utilities without running the CLI", (): void => {
  expect(parseOptions).toBeFunction();
  expect(mergeConfigAgents).toBeFunction();
  expect(resolveTargetDir).toBeFunction();
  expect(readTemplate).toBeFunction();
  expect(renderTemplate).toBeFunction();
  expect(escapeTomlBasicString).toBeFunction();
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

test("merges config agents and validates model and reasoning effort values", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unit-merge-");
  const global_config = join(fixture.cwd, "global.json");
  const repository_config = join(fixture.cwd, "repository.json");
  const explicit_config = join(fixture.cwd, "explicit.json");
  const invalid_config = join(fixture.cwd, "invalid.json");
  const invalid_reasoning_effort_config = join(fixture.cwd, "invalid-reasoning-effort.json");

  try {
    await writeJson(global_config, {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4",
          model_reasoning_effort: "low",
        },
        fixer: {
          model: "gpt-5.4",
          model_reasoning_effort: "medium",
        },
        oracle: {
          model: "gpt-5.5",
          model_reasoning_effort: "xhigh",
        },
        observer: {
          model: "gpt-5.4-mini",
        },
      },
    });
    await writeJson(repository_config, {
      agents: {
        "orchestrator-explorer": {},
        oracle: {
          model_reasoning_effort: "high",
        },
      },
    });
    await writeJson(explicit_config, {
      agents: {
        fixer: {
          model: null,
          model_reasoning_effort: null,
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
    await writeJson(invalid_reasoning_effort_config, {
      agents: {
        broken: {
          model_reasoning_effort: 5,
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
        model_reasoning_effort: "low",
      },
      fixer: {
        model: null,
        model_reasoning_effort: null,
      },
      oracle: {
        model: "gpt-5.5",
        model_reasoning_effort: "high",
      },
      observer: {
        model: "gpt-5.4-mini",
      },
    });

    await expectRejectsMessage(
      mergeConfigAgents([{ kind: "global", path: invalid_config }]),
      /Agent model must be a string or null/u
    );
    await expectRejectsMessage(
      mergeConfigAgents([{ kind: "global", path: invalid_reasoning_effort_config }]),
      /Agent model_reasoning_effort must be a string or null/u
    );
  } finally {
    await fixture.cleanup();
  }
});

test("rejects unknown reasoning effort strings", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unit-reasoning-effort-");
  const unknown_reasoning_effort_config = join(fixture.cwd, "unknown-reasoning-effort.json");
  const blank_reasoning_effort_config = join(fixture.cwd, "blank-reasoning-effort.json");

  try {
    await writeJson(unknown_reasoning_effort_config, {
      agents: {
        broken: {
          model_reasoning_effort: "extreme",
        },
      },
    });
    await writeJson(blank_reasoning_effort_config, {
      agents: {
        broken: {
          model_reasoning_effort: " ",
        },
      },
    });

    await expectRejectsMessage(
      mergeConfigAgents([{ kind: "global", path: unknown_reasoning_effort_config }]),
      /Agent model_reasoning_effort must be one of low, medium, high, xhigh, or null/u
    );
    await expectRejectsMessage(
      mergeConfigAgents([{ kind: "global", path: blank_reasoning_effort_config }]),
      /Agent model_reasoning_effort must be one of low, medium, high, xhigh, or null/u
    );
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

test("publishes configuration schema with reasoning effort enum values", async (): Promise<void> => {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8")) as {
    properties?: {
      agents?: {
        additionalProperties?: {
          properties?: {
            model_reasoning_effort?: {
              enum?: unknown[];
            };
          };
        };
      };
    };
  };
  const effort_schema =
    schema.properties?.agents?.additionalProperties?.properties?.model_reasoning_effort;

  expect(effort_schema?.enum).toEqual(["low", "medium", "high", "xhigh", null]);
});

test("reads template names and renders TOML-safe model and reasoning effort fields", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unit-template-");
  const template_path = join(fixture.cwd, "worker.toml");

  try {
    await writeFile(
      template_path,
      'name = "fixer"\nmodel = "{{MODEL}}"\n{{MODEL_REASONING_EFFORT_LINE}}developer_instructions = ""\n',
      "utf8"
    );

    const template = await readTemplate(template_path);

    expect(template.agent_name).toBe("fixer");
    expect(template.output_name).toBe("worker.toml");
    expect(
      renderTemplate(template.content, {
        model: "gpt-5.4",
        model_reasoning_effort: "high",
      })
    ).toBe(
      `${MANAGED_MARKER}\n` +
        'name = "fixer"\nmodel = "gpt-5.4"\n' +
        'model_reasoning_effort = "high"\ndeveloper_instructions = ""\n'
    );
    expect(
      renderTemplate(template.content, {
        model: "gpt-5.4",
        model_reasoning_effort: null,
      })
    ).toBe([MANAGED_MARKER, 'name = "fixer"', 'model = "gpt-5.4"', 'developer_instructions = ""'].join("\n") + "\n");
    const escaped_model = String.raw`gpt-\"5\"\nnext = \"bad\"\\tail\u0007`;

    expect(
      renderTemplate(template.content, {
        model: 'gpt-"5"\nnext = "bad"\\tail\u0007',
        model_reasoning_effort: "high",
      })
    ).toBe(
      `${MANAGED_MARKER}\n` +
        `name = "fixer"\nmodel = "${escaped_model}"\n` +
        'model_reasoning_effort = "high"\ndeveloper_instructions = ""\n'
    );
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

test("dry-run reports planned writes and unmanaged preserves without modifying files", async (): Promise<void> => {
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
    expect(result.stdout).toMatch(/\[dry-run\] preserve-unmanaged .*fixer\.toml/u);
    expect(await readFile(join(target_dir, "fixer.toml"), "utf8")).toBe("existing");
  } finally {
    await fixture.cleanup();
  }
});

test("installer preserves unmanaged target files and blocks unmanaged overwrites", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-unmanaged-");
  const target_dir = join(fixture.cwd, "agents");

  try {
    await mkdir(target_dir, { recursive: true });
    await writeFile(join(target_dir, "fixer.toml"), "user fixer", "utf8");
    await writeFile(
      join(target_dir, "orchestrator-explorer.toml"),
      `# User-authored note mentioning ${MANAGED_MARKER}\nuser explorer`,
      "utf8"
    );
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

    const dry_run = await runInstaller(
      ["--target-dir", target_dir, "--dry-run"],
      fixture.cwd,
      fixture.home
    );

    expect(dry_run.code).toBe(0);
    expect(dry_run.stdout).toMatch(/\[dry-run\] conflict .*orchestrator-explorer\.toml/u);
    expect(dry_run.stdout).toMatch(/\[dry-run\] preserve-unmanaged .*fixer\.toml/u);
    expect(await readFile(join(target_dir, "fixer.toml"), "utf8")).toBe("user fixer");
    expect(await readFile(join(target_dir, "orchestrator-explorer.toml"), "utf8")).toContain(
      "user explorer"
    );

    const install = await runInstaller(["--target-dir", target_dir], fixture.cwd, fixture.home);

    expect(install.code).not.toBe(0);
    expect(install.stderr).toMatch(/Refusing to overwrite unmanaged target agent file/u);
    expect(await readFile(join(target_dir, "orchestrator-explorer.toml"), "utf8")).toContain(
      "user explorer"
    );
  } finally {
    await fixture.cleanup();
  }
});

test("installer overwrites and removes only managed target files", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-managed-");
  const target_dir = join(fixture.cwd, "agents");

  try {
    await mkdir(target_dir, { recursive: true });
    await writeFile(
      join(target_dir, "orchestrator-explorer.toml"),
      `${MANAGED_MARKER}\nname = "orchestrator-explorer"\nmodel = "old"\n`,
      "utf8"
    );
    await writeFile(
      join(target_dir, "fixer.toml"),
      `${MANAGED_MARKER}\nname = "fixer"\nmodel = "old"\n`,
      "utf8"
    );
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

    const dry_run = await runInstaller(
      ["--target-dir", target_dir, "--dry-run"],
      fixture.cwd,
      fixture.home
    );

    expect(dry_run.code).toBe(0);
    expect(dry_run.stdout).toMatch(/\[dry-run\] overwrite-managed .*orchestrator-explorer\.toml/u);
    expect(dry_run.stdout).toMatch(/\[dry-run\] remove-managed .*fixer\.toml/u);

    const install = await runInstaller(["--target-dir", target_dir], fixture.cwd, fixture.home);

    expect(install.code).toBe(0);
    expect(await readFile(join(target_dir, "orchestrator-explorer.toml"), "utf8")).toContain(
      'model = "gpt-5.4"'
    );
    await expectRejectsCode(readFile(join(target_dir, "fixer.toml"), "utf8"), "ENOENT");
  } finally {
    await fixture.cleanup();
  }
});

test("installer reports failing write paths", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-write-failure-");
  const target_dir = join(fixture.cwd, "agents");

  try {
    await mkdir(target_dir, { recursive: true });
    await mkdir(join(target_dir, "orchestrator-explorer.toml"));
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        "orchestrator-explorer": {
          model: "gpt-5.4",
        },
      },
    });

    const result = await runInstaller(["--target-dir", target_dir], fixture.cwd, fixture.home);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/Failed to write .*orchestrator-explorer\.toml/u);
  } finally {
    await fixture.cleanup();
  }
});

test("installer reports failing removal paths", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-remove-failure-");
  const target_dir = join(fixture.cwd, "agents");

  try {
    await mkdir(target_dir, { recursive: true });
    await writeFile(join(target_dir, "fixer.toml"), `${MANAGED_MARKER}\n`, "utf8");
    await chmod(target_dir, 0o555);
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        fixer: {
          model: null,
        },
      },
    });

    const result = await runInstaller(["--target-dir", target_dir], fixture.cwd, fixture.home);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/Failed to remove .*fixer\.toml/u);
  } finally {
    await chmod(target_dir, 0o755).catch((): string => "");
    await fixture.cleanup();
  }
});

test("install-subagents skill requires interview, dry-run review, and confirmation", async (): Promise<void> => {
  const skill = await readFile(INSTALL_SUBAGENTS_SKILL_PATH, "utf8");
  const normalized_skill = skill.replaceAll(/\s+/gu, " ");

  expect(normalized_skill).toContain("Interview before planning");
  expect(normalized_skill).toContain("Local Interview Wizard");
  expect(normalized_skill).toContain("wizard url");
  expect(normalized_skill).toContain("answers path");
  expect(normalized_skill).toContain("POST /submit");
  expect(normalized_skill).toContain("closes the local server");
  expect(normalized_skill).toContain("timeout error");
  expect(normalized_skill).toContain(
    "must start the local interview wizard before running install-subagents.mjs"
  );
  expect(normalized_skill).toContain(
    "run install-subagents.mjs --dry-run only after wizard-submitted answers or a completed fallback chat interview"
  );
  expect(normalized_skill).toContain("wizard is unavailable");
  expect(normalized_skill).toContain("unsuitable for the user's environment");
  expect(normalized_skill).toContain("fails to start");
  expect(normalized_skill).toContain("user cannot open");
  expect(normalized_skill).toContain("user declines");
  expect(normalized_skill).toContain("wizard exits non-zero");
  expect(normalized_skill).toContain("wizard returns invalid answers");
  expect(normalized_skill).toContain("wizard exits without submitted answers");
  expect(normalized_skill).toContain("poll it regularly for completion");
  expect(normalized_skill).toContain("do not finish the agent response");
  expect(normalized_skill).toContain("configuration sources");
  expect(normalized_skill).toContain("target directory choices");
  expect(normalized_skill).toContain("existing matching bundled agent files");
  expect(normalized_skill).toContain("per-agent model choices");
  expect(normalized_skill).toContain("reasoning effort");
  expect(normalized_skill).toContain("optional override");
  expect(normalized_skill).toContain("planned overwrites");
  expect(normalized_skill).toContain("planned removals");
  expect(normalized_skill).toContain("cannot selectively skip a planned write");
  expect(normalized_skill).toContain("final user confirmation");
  expect(normalized_skill).toContain("must not run the non-dry-run installer");
  expect(normalized_skill.indexOf("Local Interview Wizard")).toBeLessThan(
    normalized_skill.indexOf("## Command")
  );
});

test("plugin prompt tells agents to try the install wizard before chat fallback", async (): Promise<void> => {
  const plugin_json = await readFile(PLUGIN_METADATA_PATH, "utf8");
  const plugin_metadata = JSON.parse(plugin_json) as { interface: { defaultPrompt: string[] } };
  const default_prompt = plugin_metadata.interface.defaultPrompt.join(" ");

  expect(default_prompt).toContain("attempt the local install wizard first");
  expect(default_prompt).toContain(
    "use chat fallback only when the wizard cannot run, is unsuitable, is declined, exits unsuccessfully, returns invalid answers, or times out"
  );
  expect(default_prompt).not.toContain("wizard performs installation");
});

test("discovers bundled TOML templates and includes Codex custom agent fields", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-bundled-");

  try {
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        designer: {
          model: "gpt-5.4",
          model_reasoning_effort: "medium",
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
          model_reasoning_effort: "high",
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
      expect(content).toContain("developer_instructions = ");
      expect(content).toContain("Derived from oh-my-opencode-slim 1.1.1");
      expect(content).toContain(
        "Source repository: https://github.com/alvinunreal/oh-my-opencode-slim"
      );
      expect(content).toContain("Source commit: 29e31b87fee53e13de8904f6a6ab466417528940");
      expect(content).toContain(
        "Adaptation: OpenCode-specific tools and permissions translated for Codex custom agents."
      );
    }

    const designer = await readFile(join(output_dir, "designer.toml"), "utf8");
    const oracle = await readFile(join(output_dir, "oracle.toml"), "utf8");
    const fixer = await readFile(join(output_dir, "fixer.toml"), "utf8");

    expect(designer).toContain('model_reasoning_effort = "medium"');
    expect(oracle).toContain('model_reasoning_effort = "high"');
    expect(fixer).not.toContain("model_reasoning_effort");

    const librarian = await readFile(join(output_dir, "librarian.toml"), "utf8");

    expect(librarian).toContain("[mcp_servers.context7]");
    expect(librarian).toContain('url = "https://mcp.context7.com/mcp"');
  } finally {
    await fixture.cleanup();
  }
});
