import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

type CoveragePoint = {
  label: string;
  snippets: string[];
};

type TemplateCoverage = {
  adaptation_notes: string[];
  agent_name: string;
  coverage_points: CoveragePoint[];
  source_file: string;
};

const TEMPLATE_DIR = resolve(import.meta.dirname, "..", "assets", "subagents");
const SOURCE_COMMIT = "29e31b87fee53e13de8904f6a6ab466417528940";

const TEMPLATE_COVERAGE: TemplateCoverage[] = [
  {
    agent_name: "orchestrator-explorer",
    source_file: "src/agents/explorer.ts",
    adaptation_notes: ["rg/rg --files", "structural search only when available", "read-only"],
    coverage_points: [
      {
        label: "focused codebase search role",
        snippets: ["Where is X?", "Find Y", "Which file has Z?"],
      },
      {
        label: "tool selection guidance",
        snippets: ["Text or regex patterns", "File discovery", "Structural patterns"],
      },
      {
        label: "search behavior",
        snippets: ["fast and thorough", "multiple independent searches", "relevant snippets"],
      },
      {
        label: "structured output",
        snippets: ["<results>", "<files>", "<answer>"],
      },
      {
        label: "read-only constraints",
        snippets: ["READ-ONLY", "do not modify", "exhaustive but concise"],
      },
    ],
  },
  {
    agent_name: "fixer",
    source_file: "src/agents/fixer.ts",
    adaptation_notes: ["rg/rg --files", "NO external research", "NO delegation"],
    coverage_points: [
      {
        label: "implementation-only role",
        snippets: ["complete context", "task specifications", "implement, not plan or research"],
      },
      {
        label: "execution behavior",
        snippets: [
          "Read relevant files before editing",
          "Write or update tests",
          "Run relevant validation",
        ],
      },
      {
        label: "scope constraints",
        snippets: ["NO external research", "NO delegation", "Only ask for missing inputs"],
      },
      {
        label: "insufficient context handling",
        snippets: ["If context is insufficient", "local file reads", "do not delegate"],
      },
      {
        label: "output contracts",
        snippets: ["<summary>", "<changes>", "No changes required"],
      },
    ],
  },
  {
    agent_name: "librarian",
    source_file: "src/agents/librarian.ts",
    adaptation_notes: ["Context7", "GitHub search", "grep_app equivalents"],
    coverage_points: [
      {
        label: "research role",
        snippets: [
          "Multi-repository analysis",
          "official documentation lookup",
          "library internals",
        ],
      },
      {
        label: "capabilities",
        snippets: [
          "Search and analyze external repositories",
          "Find official documentation",
          "best practices",
        ],
      },
      {
        label: "tool substitutions",
        snippets: ["Context7", "GitHub or code-search", "Web search"],
      },
      {
        label: "source evidence",
        snippets: ["evidence-based answers", "Link to official docs", "version assumptions"],
      },
      {
        label: "source distinction",
        snippets: ["official guidance", "community patterns", "your own inference"],
      },
      {
        label: "read-only default",
        snippets: ["sandbox_mode = \"read-only\""],
      },
      {
        label: "edit routing",
        snippets: [
          "READ-ONLY",
          "do not edit repository files",
          "route implementation changes to the parent or a write-capable role",
        ],
      },
    ],
  },
  {
    agent_name: "oracle",
    source_file: "src/agents/oracle.ts",
    adaptation_notes: ["read-only advisory", "available local files"],
    coverage_points: [
      {
        label: "strategic role",
        snippets: ["High-IQ debugging", "architecture decisions", "code review"],
      },
      {
        label: "capabilities",
        snippets: [
          "identify likely root causes",
          "Propose architectural solutions",
          "Enforce YAGNI",
        ],
      },
      {
        label: "advice behavior",
        snippets: ["actionable recommendations", "acknowledge uncertainty", "simpler designs"],
      },
      {
        label: "evidence",
        snippets: ["specific files and lines", "concrete files", "evidence"],
      },
      {
        label: "read-only constraints",
        snippets: ["READ-ONLY", "you do not implement", "strategy and judgment"],
      },
    ],
  },
  {
    agent_name: "observer",
    source_file: "src/agents/observer.ts",
    adaptation_notes: ["vision, OCR, PDF", "capability limits"],
    coverage_points: [
      {
        label: "visual role",
        snippets: [
          "images, screenshots, PDFs, and diagrams",
          "structured observations",
          "raw file",
        ],
      },
      {
        label: "visual analysis",
        snippets: ["layouts", "UI elements", "relationships"],
      },
      {
        label: "exact extraction",
        snippets: ["extract the exact text", "Never paraphrase error messages or code"],
      },
      {
        label: "uncertainty handling",
        snippets: ["unclear, blurry", "what you can see", "what is uncertain"],
      },
      {
        label: "constraints",
        snippets: ["READ-ONLY", "Save context tokens", "Match the language"],
      },
    ],
  },
  {
    agent_name: "designer",
    source_file: "src/agents/designer.ts",
    adaptation_notes: ["actual styling stack", "visual validation"],
    coverage_points: [
      {
        label: "design role",
        snippets: ["intentional, polished experiences", "visual impact with usability"],
      },
      {
        label: "design principles",
        snippets: ["Typography", "Color and Theme", "Motion and Interaction"],
      },
      {
        label: "composition and depth",
        snippets: ["Spatial Composition", "Visual Depth", "Match Vision to Execution"],
      },
      {
        label: "styling approach",
        snippets: ["existing styling framework", "component library", "custom CSS"],
      },
      {
        label: "review and quality",
        snippets: ["Review Responsibilities", "Output Quality", "concrete UX issues"],
      },
    ],
  },
];

async function readTemplate(agent_name: string): Promise<string> {
  return await readFile(resolve(TEMPLATE_DIR, `${agent_name}.toml`), "utf8");
}

function normalizeWhitespace(value: string): string {
  return value.replaceAll(/\s+/gu, " ");
}

function expectIncludesAll(content: string, snippets: string[], context: string): void {
  const normalized_content = normalizeWhitespace(content);

  for (const snippet of snippets) {
    expect(normalized_content, `${context} should include ${snippet}`).toContain(
      normalizeWhitespace(snippet)
    );
  }
}

describe("bundled subagent template quality", (): void => {
  for (const template of TEMPLATE_COVERAGE) {
    test(`${template.agent_name} preserves source prompt obligations`, async (): Promise<void> => {
      const content = await readTemplate(template.agent_name);

      expect(content).toContain(`name = "${template.agent_name}"`);
      expect(content).toContain(`Source commit: ${SOURCE_COMMIT}`);
      expect(content).toContain(`Source file: ${template.source_file}`);
      expect(content).toContain("Codex adaptations:");

      expectIncludesAll(
        content,
        template.adaptation_notes,
        `${template.agent_name} adaptation notes`
      );

      for (const coverage_point of template.coverage_points) {
        expectIncludesAll(
          content,
          coverage_point.snippets,
          `${template.agent_name} ${coverage_point.label}`
        );
      }
    });
  }

  test("librarian template uses an effective read-only sandbox", async (): Promise<void> => {
    const content = await readTemplate("librarian");

    expect(content).toMatch(/^sandbox_mode = "read-only"$/mu);
    expect(content).not.toMatch(/^sandbox_mode = "workspace-write"$/mu);
  });
});
