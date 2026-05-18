import { expect, test } from "bun:test";

import {
  buildThirdPartyNotice,
  getGitCloneArgs,
  getReferenceEntryNames,
  parseReferenceCliArgs,
} from "./reference-oh-my-opencode-slim.ts";

test("requires a package version", (): void => {
  expect(() => parseReferenceCliArgs([])).toThrow("--version must be a non-empty string");
});

test("parses explicit package version and reference directory", (): void => {
  expect(
    parseReferenceCliArgs([
      "--version",
      "1.2.3",
      "--repo",
      "https://github.com/example/package.git",
      "--reference-dir",
      "references/example-package",
    ])
  ).toEqual({
    help: false,
    repo_url: "https://github.com/example/package.git",
    version: "1.2.3",
    reference_dir: "references/example-package",
  });
});

test("parses help option without requiring other arguments", (): void => {
  expect(parseReferenceCliArgs(["--help"])).toEqual({
    help: true,
    repo_url: "https://github.com/alvinunreal/oh-my-opencode-slim.git",
    version: "",
    reference_dir: "references/oh-my-opencode-slim",
  });
});

test("uses git clone to fetch the tagged repository contents", (): void => {
  expect(
    getGitCloneArgs(
      {
        help: false,
        repo_url: "https://github.com/alvinunreal/oh-my-opencode-slim.git",
        version: "1.0.7",
        reference_dir: "references/oh-my-opencode-slim",
      },
      "/tmp/reference-fixture/repo"
    )
  ).toEqual([
    "git",
    "clone",
    "--depth",
    "1",
    "--branch",
    "v1.0.7",
    "https://github.com/alvinunreal/oh-my-opencode-slim.git",
    "/tmp/reference-fixture/repo",
  ]);
});

test("keeps only source-oriented reference entries", (): void => {
  expect(getReferenceEntryNames()).toEqual([
    "src",
    "package.json",
    "LICENSE",
    "AGENTS.md",
    "codemap.md",
  ]);
});

test("builds a third-party notice with source and license text", (): void => {
  expect(
    buildThirdPartyNotice({
      license_text: "MIT License\n\nCopyright (c) 2025\n",
      package_json: {
        homepage: "https://example.com/package#readme",
        license: "MIT",
        name: "example-package",
        repository: {
          type: "git",
          url: "https://github.com/example/package.git",
        },
        version: "1.2.3",
      },
      reference_dir: "references/example-package",
    })
  ).toBe(`# Third-Party Notices

This repository includes code from the following third-party projects.

## example-package

Version: 1.2.3
Source: https://github.com/example/package.git
License: MIT
Reference path: \`references/example-package\`

The upstream license text is reproduced below.

\`\`\`text
MIT License

Copyright (c) 2025
\`\`\`
`);
});
