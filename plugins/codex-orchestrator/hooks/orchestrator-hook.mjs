#!/usr/bin/env node
// @ts-check

import { stdin, stdout, stderr, exit } from "node:process";
import { buildHookOutput } from "./orchestrator-enforcement.mjs";

async function readStdin() {
  let input = "";

  stdin.setEncoding("utf8");

  for await (const chunk of stdin) {
    input += chunk;
  }

  return input;
}

async function main() {
  const raw_input = await readStdin();
  const parsed_input = raw_input.trim().length === 0 ? {} : JSON.parse(raw_input);
  const output = buildHookOutput(parsed_input);

  if (output !== null) {
    stdout.write(`${JSON.stringify(output)}\n`);
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  stderr.write(`codex-orchestrator hook failed: ${message}\n`);
  exit(1);
}
