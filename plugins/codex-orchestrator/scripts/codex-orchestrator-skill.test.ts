import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

const ORCHESTRATOR_SKILL_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "codex-orchestrator",
  "SKILL.md"
);
const STOP_HOOK_PATH = resolve(import.meta.dirname, "..", "hooks", "orchestrator-enforcement.mjs");

async function readNormalized(path: string): Promise<string> {
  const text = await readFile(path, "utf8");

  return text.replaceAll(/\s+/gu, " ");
}

describe("codex-orchestrator skill guidance", (): void => {
  test("requires iterative oracle closure instead of a single review pass", async (): Promise<void> => {
    const skill = await readNormalized(ORCHESTRATOR_SKILL_PATH);

    expect(skill).toContain("Oracle review closure is iterative");
    expect(skill).toContain("A single oracle pass is not sufficient");
    expect(skill).toContain("Continue until oracle reports no remaining actionable findings");
    expect(skill).toContain("every remaining finding is explicitly accounted for");
    expect(skill).toContain("Request follow-up oracle review after accepted findings");
  });

  test("rejects subjective oracle loop stopping reasons", async (): Promise<void> => {
    const skill = await readNormalized(ORCHESTRATOR_SKILL_PATH);

    for (const snippet of [
      "Cost, speed, convenience",
      "perceived simplicity",
      "parent confidence",
      "small diff size",
      "routine judgment",
      '"oracle was already consulted once"',
      '"good enough"',
      "are not valid stopping reasons",
    ]) {
      expect(skill).toContain(snippet);
    }
  });

  test("defines meaningful changes that require follow-up oracle review", async (): Promise<void> => {
    const skill = await readNormalized(ORCHESTRATOR_SKILL_PATH);

    for (const snippet of [
      "Meaningful accepted changes include changes to behavior",
      "requirements",
      "prompt interpretation",
      "workflow",
      "routing criteria",
      "schema behavior",
      "hook behavior",
      "installer behavior",
      "verification strategy",
      "risk handling",
      "maintainability-sensitive structure",
    ]) {
      expect(skill).toContain(snippet);
    }
  });

  test("requires oracle finding ledger fields, statuses, and closure reporting", async (): Promise<void> => {
    const skill = await readNormalized(ORCHESTRATOR_SKILL_PATH);

    for (const snippet of [
      "finding ledger for every oracle finding with a stable identifier",
      "status, rationale, and resolution evidence",
      "every remaining finding is explicitly accounted for with user-visible residual risk",
      "concrete rationale, evidence, and user-visible residual risk",
      "Accepted and fixed",
      "Accepted but pending with user-visible residual risk",
      "Rejected with rationale",
      "Deferred with risk disclosed",
      "Already mitigated with evidence",
      "oracle closure evidence",
      "number of oracle review passes",
      "accepted findings and resolutions",
      "every remaining finding status with rationale, evidence, and user-visible residual risk",
      "the final oracle result",
    ]) {
      expect(skill).toContain(snippet);
    }
  });

  test("keeps iterative oracle review as skill guidance rather than Stop hook enforcement", async (): Promise<void> => {
    const skill = await readNormalized(ORCHESTRATOR_SKILL_PATH);
    const stop_hook = await readNormalized(STOP_HOOK_PATH);

    expect(skill).toContain(
      "use the iterative oracle review closure loop as parent finalization guidance rather than Stop hook enforcement"
    );
    expect(stop_hook).not.toContain("iterative oracle review");
    expect(stop_hook).not.toContain("finding ledger");
    expect(stop_hook).not.toContain("oracle review passes");
  });
});
