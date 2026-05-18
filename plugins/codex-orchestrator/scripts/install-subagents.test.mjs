// @ts-check
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import test from "node:test";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = resolve(import.meta.dirname, "install-subagents.mjs");

/**
 * @typedef {object} RunResult
 * @property {number} code
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * @param {string[]} args
 * @param {string} cwd
 * @param {string} home
 * @returns {Promise<RunResult>}
 */
async function runInstaller(args, cwd, home) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [SCRIPT_PATH, ...args], {
      cwd,
      env: {
        HOME: home,
      },
    });

    return {
      code: 0,
      stdout,
      stderr,
    };
  } catch (error) {
    assert.ok(error instanceof Error);
    const exec_error = /** @type {Error & { code?: number; stdout?: string; stderr?: string }} */ (
      error
    );

    return {
      code: exec_error.code ?? 1,
      stdout: exec_error.stdout ?? "",
      stderr: exec_error.stderr ?? "",
    };
  }
}

/**
 * @param {string} prefix
 * @returns {Promise<{ cwd: string; home: string; cleanup: () => Promise<void> }>}
 */
async function createFixture(prefix) {
  const root_dir = await mkdtemp(join(tmpdir(), prefix));
  const cwd = join(root_dir, "repo");
  const home = join(root_dir, "home");

  await mkdir(cwd, { recursive: true });
  await mkdir(home, { recursive: true });

  return {
    cleanup: async () => {
      await rm(root_dir, { force: true, recursive: true });
    },
    cwd,
    home,
  };
}

/**
 * @param {string} path
 * @param {unknown} config
 * @returns {Promise<void>}
 */
async function writeJson(path, config) {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2), "utf8");
}

test("rejects removed --model option", async () => {
  const fixture = await createFixture("install-subagents-model-");

  try {
    const result = await runInstaller(["--model", "gpt-5.4"], fixture.cwd, fixture.home);

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Unknown option '--model'/u);
  } finally {
    await fixture.cleanup();
  }
});

test("merges config precedence and lets null disable inherited agents", async () => {
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

    assert.equal(result.code, 0, result.stderr);
    assert.match(
      await readFile(join(target_dir, "codebase-explorer.yaml"), "utf8"),
      /gpt-5\.4-codex/u
    );
    await assert.rejects(readFile(join(target_dir, "implementation-worker.yaml"), "utf8"), {
      code: "ENOENT",
    });
  } finally {
    await fixture.cleanup();
  }
});

test("inherits lower-priority model when higher-priority agent has no model field", async () => {
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

    assert.equal(result.code, 0, result.stderr);
    assert.match(
      await readFile(join(fixture.cwd, ".codex", "agents", "codebase-explorer.yaml"), "utf8"),
      /gpt-5\.4/u
    );
  } finally {
    await fixture.cleanup();
  }
});

test("defaults repository config installs to the repository agent directory", async () => {
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

    assert.equal(result.code, 0, result.stderr);
    assert.match(
      await readFile(join(fixture.cwd, ".codex", "agents", "codebase-explorer.yaml"), "utf8"),
      /gpt-5\.4-codex/u
    );
  } finally {
    await fixture.cleanup();
  }
});

test("defaults global-only config installs to the global agent directory", async () => {
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

    assert.equal(result.code, 0, result.stderr);
    assert.match(
      await readFile(join(fixture.home, ".codex", "agents", "implementation-worker.yaml"), "utf8"),
      /gpt-5\.4/u
    );
  } finally {
    await fixture.cleanup();
  }
});

test("fails without any configuration", async () => {
  const fixture = await createFixture("install-subagents-missing-config-");

  try {
    const result = await runInstaller([], fixture.cwd, fixture.home);

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /No Codex Orchestrator configuration found/u);
  } finally {
    await fixture.cleanup();
  }
});

test("requires target directory for explicit config", async () => {
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

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /--target-dir is required when --config is provided/u);
  } finally {
    await fixture.cleanup();
  }
});

test("dry-run reports planned writes and removals without modifying files", async () => {
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

    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /\[dry-run\] write .*codebase-explorer\.yaml/u);
    assert.match(result.stdout, /\[dry-run\] remove .*implementation-worker\.yaml/u);
    assert.equal(
      await readFile(join(target_dir, "implementation-worker.yaml"), "utf8"),
      "existing"
    );
  } finally {
    await fixture.cleanup();
  }
});
