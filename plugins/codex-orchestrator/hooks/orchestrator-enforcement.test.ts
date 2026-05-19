import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  buildHookOutput,
  buildStopOutput,
  buildUserPromptSubmitOutput,
  hasExplicitOptOut,
  isApplicablePrompt,
  shouldContinueAtStop,
} from "./orchestrator-enforcement.mjs";

type RunResult = {
  code: number;
  stderr: string;
  stdout: string;
};

const NODE_EXECUTABLE = Bun.which("node") ?? "node";
const HOOK_PATH = resolve(import.meta.dirname, "orchestrator-hook.mjs");

async function runHook(input: unknown): Promise<RunResult> {
  const child = spawn(NODE_EXECUTABLE, [HOOK_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const stdout_chunks: Buffer[] = [];
  const stderr_chunks: Buffer[] = [];

  child.stdout.on("data", (chunk: Buffer): void => {
    stdout_chunks.push(chunk);
  });
  child.stderr.on("data", (chunk: Buffer): void => {
    stderr_chunks.push(chunk);
  });
  child.stdin.end(JSON.stringify(input));

  const code = await new Promise<number>(resolve_exit => {
    child.on("close", exit_code => {
      resolve_exit(exit_code ?? 1);
    });
  });

  return {
    code,
    stderr: Buffer.concat(stderr_chunks).toString("utf8"),
    stdout: Buffer.concat(stdout_chunks).toString("utf8"),
  };
}

describe("orchestrator hook prompt decisions", (): void => {
  test("detects applicable implementation prompts", (): void => {
    expect(isApplicablePrompt("Implement the hook support and add tests.")).toBe(true);
    expect(isApplicablePrompt("Debug the failing repository tests.")).toBe(true);
    expect(isApplicablePrompt("Review this codebase and verify the plugin behavior.")).toBe(true);
    expect(isApplicablePrompt("이 저장소의 타입체크 에러를 수정하고 테스트를 추가하세요.")).toBe(
      true
    );
  });

  test("detects explicit opt-out prompts", (): void => {
    expect(hasExplicitOptOut("Fix this but do not use subagents.")).toBe(true);
    expect(hasExplicitOptOut("Use no delegation for this task.")).toBe(true);
    expect(hasExplicitOptOut("Avoid the codex-orchestrator skill.")).toBe(true);
    expect(hasExplicitOptOut("서브에이전트 쓰지 말고 직접 수정하세요.")).toBe(true);
    expect(hasExplicitOptOut("오케스트레이션 없이 처리하세요.")).toBe(true);
    expect(isApplicablePrompt("Implement this locally only.")).toBe(false);
  });

  test("ignores non-coding prompts", (): void => {
    expect(isApplicablePrompt("What is the capital of France?")).toBe(false);
  });

  test("builds UserPromptSubmit additional context for applicable prompts", (): void => {
    const output = buildUserPromptSubmitOutput({
      hook_event_name: "UserPromptSubmit",
      prompt: "Add tests for this plugin hook.",
    });

    expect(output).toEqual({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: expect.stringContaining("codex-orchestrator workflow"),
      },
    });
  });

  test("does not build UserPromptSubmit context for opt-out prompts", (): void => {
    const output = buildUserPromptSubmitOutput({
      hook_event_name: "UserPromptSubmit",
      prompt: "Fix this without subagents.",
    });

    expect(output).toBeNull();
  });
});

describe("orchestrator hook stop decisions", (): void => {
  test("continues completion claims that omit verification", (): void => {
    expect(
      shouldContinueAtStop({
        hook_event_name: "Stop",
        stop_hook_active: false,
        last_assistant_message: "Implemented the hook. Done.",
      })
    ).toBe(true);
  });

  test("does not continue when Stop hook is already active", (): void => {
    expect(
      shouldContinueAtStop({
        hook_event_name: "Stop",
        stop_hook_active: true,
        last_assistant_message: "Implemented the hook. Done.",
      })
    ).toBe(false);
  });

  test("allows completion messages with verification evidence", (): void => {
    const output = buildStopOutput({
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "Implemented the hook and ran bun run test.",
    });

    expect(output).toEqual({
      continue: true,
    });
  });

  test("allows Korean completion messages with verification evidence", (): void => {
    const output = buildStopOutput({
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "수정했고 타입체크를 실행했습니다.",
    });

    expect(output).toEqual({
      continue: true,
    });
  });
});

describe("orchestrator hook CLI", (): void => {
  test("prints valid UserPromptSubmit hook JSON for applicable prompts", async (): Promise<void> => {
    const result = await runHook({
      hook_event_name: "UserPromptSubmit",
      prompt: "Investigate the repository and implement the hook.",
    });

    expect(result).toEqual({
      code: 0,
      stderr: "",
      stdout: expect.any(String),
    });

    const output = JSON.parse(result.stdout);

    expect(output.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
    expect(output.hookSpecificOutput.additionalContext).toContain("mandatory-by-default");
  });

  test("prints no UserPromptSubmit output for explicit opt-out prompts", async (): Promise<void> => {
    const result = await runHook({
      hook_event_name: "UserPromptSubmit",
      prompt: "Implement the fix, but do not use orchestration.",
    });

    expect(result).toEqual({
      code: 0,
      stderr: "",
      stdout: "",
    });
  });

  test("prints Stop continuation JSON for premature completion", async (): Promise<void> => {
    const result = await runHook({
      hook_event_name: "Stop",
      stop_hook_active: false,
      last_assistant_message: "Fixed it. Done.",
    });

    expect(result.code).toBe(0);

    const output = JSON.parse(result.stdout);

    expect(output.decision).toBe("block");
    expect(output.reason).toContain("completion standard");
  });

  test("routes unsupported events to no output", (): void => {
    expect(buildHookOutput({ hook_event_name: "SessionStart" })).toBeNull();
  });
});
