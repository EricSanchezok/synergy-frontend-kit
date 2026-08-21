import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FrontendKitPlugin, SKILL_ENTRIES } from "./src";
import { renderSetupResult, runSetup, type SetupStepResult } from "./src/setup";
import { parseSkillFrontmatter } from "./scripts/skill-frontmatter";

interface SkillSource {
  name: string;
  aliases?: string[];
  dependencies?: string[];
  licenseFiles?: string[];
  source: {
    type: "local" | "git";
    repo?: string;
    ref?: string;
  };
}

interface SourcesFile {
  skills: SkillSource[];
}

interface SkillsLock {
  schemaVersion: number;
  sources: Record<string, { repo: string; ref: string; commit: string }>;
}

const ROOT = import.meta.dirname;
const SKILLS_DIR = join(ROOT, "skills");
const SOURCES_PATH = join(ROOT, "skills.sources.json");
const LOCK_PATH = join(ROOT, "skills.lock.json");
const sources = JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile;
const sourceLock = JSON.parse(readFileSync(LOCK_PATH, "utf-8")) as SkillsLock;
const expectedSkills = sources.skills.map((skill) => skill.name);

function readFrontmatter(name: string): Record<string, string> {
  const content = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
  return parseSkillFrontmatter(content, `${name}/SKILL.md`) as Record<string, string>;
}

test("all sourced skill directories exist", () => {
  for (const name of expectedSkills) {
    expect(
      existsSync(join(SKILLS_DIR, name)),
      `missing skill directory: ${name}`,
    ).toBe(true);
    expect(
      existsSync(join(SKILLS_DIR, name, "SKILL.md")),
      `missing SKILL.md: ${name}`,
    ).toBe(true);
  }
});

describe("SKILL.md frontmatter", () => {
  for (const source of sources.skills) {
    test(`${source.name} has stable public identity`, () => {
      const frontmatter = readFrontmatter(source.name);
      expect(frontmatter.name).toBe(source.name);
      expect(frontmatter.description?.length ?? 0).toBeGreaterThan(0);
    });
  }
});

test("generated plugin descriptions match complete frontmatter descriptions", () => {
  for (const entry of SKILL_ENTRIES) {
    const frontmatter = readFrontmatter(entry.name);
    expect(entry.description, `${entry.name} generated description`).toBe(
      frontmatter.description,
    );
    expect(entry.description).not.toMatch(/^[>|][+-]?$/);
  }
});

test("frontmatter parser supports YAML block scalar chomping indicators", () => {
  const folded = parseSkillFrontmatter(`---\nname: folded\ndescription: >-\n  First line.\n  Second line.\n---\n`);
  const literal = parseSkillFrontmatter(`---\nname: literal\ndescription: |-\n  First line.\n  Second line.\n---\n`);
  expect(folded.description).toBe("First line. Second line.");
  expect(literal.description).toBe("First line.\nSecond line.");
});

test("declared cross-skill dependencies are bundled", () => {
  const bundled = new Set(expectedSkills);
  for (const source of sources.skills) {
    for (const dependency of source.dependencies ?? []) {
      expect(bundled.has(dependency), `${source.name} -> ${dependency}`).toBe(true);
    }
  }
});

test("every tracked upstream source has exactly one immutable lock", () => {
  expect(sourceLock.schemaVersion).toBe(1);
  const expectedKeys = new Set(
    sources.skills
      .filter((source) => source.source.type === "git")
      .map((source) => `${source.source.repo}#${source.source.ref ?? "HEAD"}`),
  );
  expect(new Set(Object.keys(sourceLock.sources))).toEqual(expectedKeys);
  for (const [key, locked] of Object.entries(sourceLock.sources)) {
    expect(locked.commit, key).toMatch(/^[0-9a-f]{40}$/);
    expect(`${locked.repo}#${locked.ref}`).toBe(key);
  }
});

test("Plugin API 4 definition contributes all skills in source order", () => {
  expect(FrontendKitPlugin).toMatchObject({
    version: "0.7.1",
    compatibility: { synergy: ">=3.0.11" },
    capabilities: [{ id: "shell.execute" }],
  });
  const actual = FrontendKitPlugin.contributions
    .filter((contribution) => contribution.kind === "skill")
    .map((contribution) => contribution.id);
  expect(actual).toEqual(expectedSkills);
  expect(SKILL_ENTRIES.map((entry) => entry.name)).toEqual(expectedSkills);
});

test("Plugin API 4 definition contains eager settings-gated MCP, CLI, and native Settings without Workbench", () => {
  const mcpContributions = FrontendKitPlugin.contributions.filter(
    (item) => item.kind === "mcp",
  );
  expect(mcpContributions.map((item) => item.id)).toEqual([
    "shadcn",
    "layout-context",
    "playwright",
  ]);
  expect(
    mcpContributions.map((item) => ({
      startup: item.server.startup,
      enabledWhen: item.enabledWhen,
    })),
  ).toEqual([
    {
      startup: "eager",
      enabledWhen: { setting: "shadcn", equals: true },
    },
    {
      startup: "eager",
      enabledWhen: { setting: "layoutContext", equals: true },
    },
    {
      startup: "eager",
      enabledWhen: { setting: "playwright", equals: true },
    },
  ]);
  expect(
    FrontendKitPlugin.contributions.some(
      (item) => item.kind === "cli.command" && item.id === "setup",
    ),
  ).toBe(true);
  expect(
    FrontendKitPlugin.contributions
      .filter((item) => item.requires?.includes("shell.execute"))
      .map((item) => `${item.kind}:${item.id}`),
  ).toEqual(["cli.command:setup"]);
  const settingsContribution = FrontendKitPlugin.contributions.find(
    (item) => item.kind === "ui.settings" && item.id === "frontend-kit",
  ) as Extract<
    (typeof FrontendKitPlugin.contributions)[number],
    { kind: "ui.settings" }
  > | undefined;
  expect(settingsContribution).toBeDefined();
  expect(settingsContribution).not.toHaveProperty("component");
  expect(settingsContribution?.formSchema?.properties).toEqual({
    shadcn: expect.objectContaining({ type: "boolean", default: true }),
    layoutContext: expect.objectContaining({ type: "boolean", default: true }),
    playwright: expect.objectContaining({ type: "boolean", default: true }),
  });
  expect(
    FrontendKitPlugin.contributions.some(
      (item) => item.kind === "ui.workbenchPanel",
    ),
  ).toBe(false);
});

test("no orphan skill directories exist", () => {
  const onDisk = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  expect(onDisk).toEqual([...expectedSkills].sort());
});

test("declared license files are bundled", () => {
  for (const source of sources.skills) {
    for (const licenseFile of source.licenseFiles ?? []) {
      expect(
        existsSync(join(SKILLS_DIR, source.name, licenseFile)),
        `${source.name} must include ${licenseFile}`,
      ).toBe(true);
    }
  }
});

test("setup renderer supports machine-readable dry-run output", () => {
  const steps: SetupStepResult[] = [
    {
      id: "shadcn",
      label: "Initialize shadcn/ui",
      command: ["npx", "-y", "shadcn@4.11.0", "init", "-d"],
      fallback: "npx shadcn@4.11.0 init -d",
      skipped: false,
      ok: true,
    },
  ];
  const parsed = JSON.parse(
    renderSetupResult(steps, { "dry-run": true, json: true }),
  );
  expect(parsed.plugin).toBe("synergy-frontend-kit");
  expect(parsed.dryRun).toBe(true);
  expect(parsed.steps[0].id).toBe("shadcn");
});

test("setup executes argv commands through shell.run and preserves nonzero results", async () => {
  const commands: string[][] = [];
  const results = await runSetup(
    {
      shell: {
        async run(input) {
          commands.push(input.command);
          return {
            stdout: "",
            stderr: input.command.includes("playwright@1.61.1") ? "failed" : "",
            exitCode: input.command.includes("playwright@1.61.1") ? 2 : 0,
          };
        },
      },
    },
    {},
  );
  expect(commands).toHaveLength(3);
  expect(results.map((result) => result.ok)).toEqual([true, true, false]);
  expect(results[2].error).toBe("failed");
});
