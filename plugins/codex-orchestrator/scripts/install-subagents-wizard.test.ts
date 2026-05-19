import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, jest, test } from "bun:test";
import {
  createWizardSession,
  listenWizard,
  parseWizardOptions,
  renderWizardHtml,
  saveSubmittedAnswers,
  validateAnswers,
  waitForAnswersFile,
} from "./install-subagents-wizard.mjs";

type Fixture = {
  cleanup: () => Promise<void>;
  cwd: string;
  global_config_path: string;
  root_dir: string;
};

type WizardServer = Awaited<ReturnType<typeof listenWizard>>;

const ASSET_DIR = resolve(import.meta.dirname, "..", "assets", "subagents");
const NODE_EXECUTABLE = Bun.which("node") ?? "node";
const SCRIPT_PATH = resolve(import.meta.dirname, "install-subagents-wizard.mjs");

async function createFixture(prefix: string): Promise<Fixture> {
  const root_dir = await mkdtemp(join(tmpdir(), prefix));
  const cwd = join(root_dir, "repo");
  const home = join(root_dir, "home");
  const global_config_path = join(home, ".codex", "codex-orchestrator.json");

  await mkdir(cwd, { recursive: true });
  await mkdir(home, { recursive: true });

  return {
    cleanup: async (): Promise<void> => {
      await rm(root_dir, { force: true, recursive: true });
    },
    cwd,
    global_config_path,
    root_dir,
  };
}

async function closeServer(server: WizardServer): Promise<void> {
  await new Promise<void>((resolve_promise, reject_promise) => {
    server.close(error => {
      if (error === undefined) {
        resolve_promise();
        return;
      }
      if ("code" in error && error.code === "ERR_SERVER_NOT_RUNNING") {
        resolve_promise();
        return;
      }
      reject_promise(error);
    });
  });
}

async function writeJson(path: string, config: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2), "utf8");
}

test("parses wizard options", (): void => {
  const options = parseWizardOptions([
    "--config",
    "~/codex-orchestrator.json",
    "--target-dir",
    "~/agents",
    "--answers-dir",
    "~/answers",
    "--port",
    "45123",
  ]);

  expect(options.config_path).toEndWith("/codex-orchestrator.json");
  expect(options.target_dir).toEndWith("/agents");
  expect(options.answers_dir).toEndWith("/answers");
  expect(options.host).toBe("127.0.0.1");
  expect(options.port).toBe(45_123);
});

test("builds wizard state from config, templates, and installed files", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-state-");
  const target_dir = join(fixture.cwd, ".codex", "agents");

  try {
    await writeJson(join(fixture.cwd, "codex-orchestrator.json"), {
      agents: {
        fixer: {
          model: "gpt-5.4-mini",
          model_reasoning_effort: "low",
        },
        oracle: {
          model: null,
        },
      },
    });
    await mkdir(target_dir, { recursive: true });
    await writeFile(join(target_dir, "fixer.toml"), "existing", "utf8");

    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });

    const fixer = session.agents.find(agent => agent.agent_name === "fixer");
    const oracle = session.agents.find(agent => agent.agent_name === "oracle");

    expect(session.config_sources.find(source => source.kind === "repository")?.exists).toBe(true);
    expect(session.target_dirs.find(target => target.kind === "default")?.path).toBe(target_dir);
    expect(fixer?.installed).toBe(true);
    expect(fixer?.model).toBe("gpt-5.4-mini");
    expect(fixer?.model_reasoning_effort).toBe("low");
    expect(oracle?.model).toBe(null);
  } finally {
    await fixture.cleanup();
  }
});

test("renders a single page with inline state and expected controls", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-html-");

  try {
    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });
    const html = renderWizardHtml(session);

    expect(html).toContain("Subagent install wizard");
    expect(html).toContain("Submit answers");
    expect(html).toContain('id="wizard-state"');
    expect(html).toContain("orchestrator-explorer");
    expect(html).toContain("Reasoning effort");
    expect(html).toContain("window.close()");
    expect(html).toContain("This tab can be closed.");
  } finally {
    await fixture.cleanup();
  }
});

test("renders parseable inline wizard state JSON", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-json-");

  try {
    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });
    const html = renderWizardHtml(session);
    const state_json = html.match(
      /<script type="application\/json" id="wizard-state">(?<json>[\S\s]*?)<\/script>/u
    )?.groups?.json;

    expect(state_json).toBeString();
    expect(JSON.parse(state_json ?? "{}")).toHaveProperty("token", session.token);
  } finally {
    await fixture.cleanup();
  }
});

test("validates and saves submitted answers without touching config or agent files", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-submit-");
  const config_path = join(fixture.cwd, "codex-orchestrator.json");
  const target_dir = join(fixture.cwd, ".codex", "agents");
  const agent_path = join(target_dir, "fixer.toml");

  try {
    await writeJson(config_path, {
      agents: {
        fixer: {
          model: "gpt-5.4-mini",
        },
      },
    });
    await mkdir(target_dir, { recursive: true });
    await writeFile(agent_path, "existing agent", "utf8");

    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir,
    });
    const body = buildValidAnswers(session);
    const saved = await saveSubmittedAnswers(session, body);
    const answers = JSON.parse(await readFile(session.answers_path, "utf8")) as {
      schema_version?: number;
    };

    expect(saved).toHaveProperty("schema_version", 1);
    expect(answers.schema_version).toBe(1);
    expect(await readFile(config_path, "utf8")).toContain("gpt-5.4-mini");
    expect(await readFile(agent_path, "utf8")).toBe("existing agent");
  } finally {
    await fixture.cleanup();
  }
});

test("rejects invalid submit tokens", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-token-");

  try {
    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });
    const body = {
      ...buildValidAnswers(session),
      token: "wrong",
    };

    expect((): void => {
      validateAnswers(session, body);
    }).toThrow("Invalid wizard session token.");
  } finally {
    await fixture.cleanup();
  }
});

test("serves the form and writes answers through POST", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-server-");

  try {
    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });
    const server = await listenWizard(session, {
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });

    try {
      expect(session.url).toStartWith("http://127.0.0.1:");

      const page = await fetch(session.url ?? "");

      expect(page.status).toBe(200);
      expect(await page.text()).toContain("Submit answers");

      const submit = await fetch(`${session.url ?? ""}submit`, {
        body: JSON.stringify(buildValidAnswers(session)),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const result = (await submit.json()) as { answers_path?: string; ok?: boolean };

      expect(submit.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.answers_path).toBe(session.answers_path);
      expect(await readFile(session.answers_path, "utf8")).toContain('"schema_version": 1');
    } finally {
      await closeServer(server);
    }
  } finally {
    await fixture.cleanup();
  }
});

test("closes the server after a successful submit", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-close-");

  try {
    const session = await createWizardSession({
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
    });
    const server = await listenWizard(session, {
      answers_dir: join(fixture.root_dir, "answers"),
      asset_dir: ASSET_DIR,
      config_path: undefined,
      cwd: fixture.cwd,
      global_config_path: fixture.global_config_path,
      help: false,
      host: "127.0.0.1",
      port: 0,
      target_dir: undefined,
      timeout_ms: 1000,
    });
    const closed = new Promise<void>(resolve_promise => {
      server.once("close", resolve_promise);
    });

    const submit = await fetch(`${session.url ?? ""}submit`, {
      body: JSON.stringify(buildValidAnswers(session)),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    expect(submit.status).toBe(200);
    await closed;
    expect(await readFile(session.answers_path, "utf8")).toContain('"schema_version": 1');
  } finally {
    await fixture.cleanup();
  }
});

test("waits for answers file and rejects on timeout using fake timers", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-wait-");
  const answers_path = join(fixture.root_dir, "answers", "answers.json");

  try {
    const waiting = waitForAnswersFile(answers_path, 1000, 10);

    await mkdir(dirname(answers_path), { recursive: true });
    await writeFile(answers_path, '{"ok":true}\n', "utf8");

    expect(await waiting).toBe('{"ok":true}\n');

    jest.useFakeTimers();
    try {
      const timeout = waitForAnswersFile(join(fixture.root_dir, "missing.json"), 1000, 100);

      await Promise.resolve();
      jest.advanceTimersByTime(1001);
      await timeout;
      throw new Error("Expected waitForAnswersFile to time out.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Timed out waiting for wizard answers");
    } finally {
      jest.useRealTimers();
    }
  } finally {
    await fixture.cleanup();
  }
});

test("CLI waits for submit, prints answers, and exits", async (): Promise<void> => {
  const fixture = await createFixture("install-subagents-wizard-cli-");
  const child = spawn(
    NODE_EXECUTABLE,
    [SCRIPT_PATH, "--answers-dir", join(fixture.root_dir, "answers"), "--timeout-ms", "3000"],
    {
      cwd: fixture.cwd,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  let stdout = "";
  let stderr = "";
  const stdout_stream = child.stdout;
  const stderr_stream = child.stderr;

  if (stdout_stream === null || stderr_stream === null) {
    throw new Error("Expected child stdout and stderr pipes.");
  }

  stdout_stream.setEncoding("utf8");
  stderr_stream.setEncoding("utf8");
  stdout_stream.on("data", chunk => {
    stdout += chunk;
  });
  stderr_stream.on("data", chunk => {
    stderr += chunk;
  });

  try {
    const url = await waitForStdoutMatch(child, () => stdout.match(/wizard url (?<url>http:\/\/[^\s]+)/u))
      .then(match => match.groups?.url ?? "");
    const page = await fetch(url);
    const html = await page.text();
    const state_json = html.match(
      /<script type="application\/json" id="wizard-state">(?<json>[\S\s]*?)<\/script>/u
    )?.groups?.json;

    expect(state_json).toBeString();

    const state = JSON.parse(state_json ?? "{}") as Awaited<ReturnType<typeof createWizardSession>>;
    const submit = await fetch(`${url}submit`, {
      body: JSON.stringify(buildValidAnswers(state)),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const [code] = (await once(child, "exit")) as [number];

    expect(submit.status).toBe(200);
    expect(code).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("submitted answers");
    expect(stdout).toContain('"schema_version": 1');
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await once(child, "exit");
    }
    await fixture.cleanup();
  }
});

async function waitForStdoutMatch(
  child: ReturnType<typeof spawn>,
  getMatch: () => RegExpMatchArray | null
): Promise<RegExpMatchArray> {
  const stdout = child.stdout;

  if (stdout === null) {
    throw new Error("Expected child stdout pipe.");
  }

  const existing_match = getMatch();

  if (existing_match !== null) {
    return existing_match;
  }

  return await new Promise((resolve_promise, reject_promise) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject_promise(new Error("Timed out waiting for wizard stdout."));
    }, 1000);
    const onData = (): void => {
      const match = getMatch();

      if (match !== null) {
        cleanup();
        resolve_promise(match);
      }
    };
    const onExit = (): void => {
      cleanup();
      reject_promise(new Error("Wizard exited before printing URL."));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      stdout.off("data", onData);
      child.off("exit", onExit);
    };

    stdout.on("data", onData);
    child.once("exit", onExit);
  });
}

function buildValidAnswers(session: Awaited<ReturnType<typeof createWizardSession>>): object {
  const config_destination = session.config_destinations.find(choice => choice.selected)?.path;
  const target_dir = session.target_dirs.find(choice => choice.selected)?.path;

  return {
    agents: Object.fromEntries(
      session.agents.map(agent => [
        agent.agent_name,
        {
          enabled: true,
          model: agent.model ?? "gpt-5.4-mini",
          model_reasoning_effort: agent.model_reasoning_effort,
        },
      ])
    ),
    config_destination,
    target_dir,
    token: session.token,
  };
}
