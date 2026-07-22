import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FrontendKitPlugin, SKILL_ENTRIES } from "./src";
import { renderSetupResult, runSetup, type SetupStepResult } from "./src/setup";

interface SkillSource {
  name: string;
  aliases?: string[];
  licenseFiles?: string[];
}

interface SourcesFile {
  skills: SkillSource[];
}

const ROOT = import.meta.dirname;
const SKILLS_DIR = join(ROOT, "skills");
const SOURCES_PATH = join(ROOT, "skills.sources.json");
const sources = JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile;
const expectedSkills = sources.skills.map((skill) => skill.name);

function readFrontmatter(name: string): Record<string, string> {
  const content = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(match, `${name}/SKILL.md must have YAML frontmatter`).not.toBeNull();
  const result: Record<string, string> = {};
  for (const rawLine of match?.[1].split("\n") ?? []) {
    const field = rawLine
      .replace(/\r$/, "")
      .match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    const value = field[2].trim();
    const first = value[0];
    const last = value[value.length - 1];
    result[field[1]] =
      value.length >= 2 && (first === `"` || first === "'") && first === last
        ? value.slice(1, -1)
        : value;
  }
  return result;
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

test("API3 definition contributes all skills in source order", () => {
  const actual = FrontendKitPlugin.contributions
    .filter((contribution) => contribution.kind === "skill")
    .map((contribution) => contribution.id);
  expect(actual).toEqual(expectedSkills);
  expect(SKILL_ENTRIES.map((entry) => entry.name)).toEqual(expectedSkills);
});

test("API3 definition contains MCP, CLI, and Settings without Workbench", () => {
  expect(
    FrontendKitPlugin.contributions
      .filter((item) => item.kind === "mcp")
      .map((item) => item.id),
  ).toEqual(["shadcn", "layout-context", "playwright"]);
  expect(
    FrontendKitPlugin.contributions.some(
      (item) => item.kind === "cli.command" && item.id === "setup",
    ),
  ).toBe(true);
  expect(
    FrontendKitPlugin.contributions.some(
      (item) => item.kind === "ui.settings" && item.id === "frontend-kit",
    ),
  ).toBe(true);
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
