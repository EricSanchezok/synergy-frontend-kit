import { describe, expect, test } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { renderSetupResult, type SetupStepResult } from "./src/setup"

interface SkillSource {
  name: string
  aliases?: string[]
  licenseFiles?: string[]
}

interface SourcesFile {
  skills: SkillSource[]
}

const ROOT = import.meta.dirname
const SKILLS_DIR = join(ROOT, "skills")
const PLUGIN_JSON_PATH = join(ROOT, "plugin.json")
const SOURCES_PATH = join(ROOT, "skills.sources.json")
const INDEX_PATH = join(ROOT, "src", "index.ts")

const sources = JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile
const expectedSkills = sources.skills.map((skill) => skill.name)

function readFrontmatter(name: string): Record<string, string> {
  const content = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8")
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  expect(match, `${name}/SKILL.md must have YAML frontmatter`).not.toBeNull()

  const result: Record<string, string> = {}
  for (const rawLine of match?.[1].split("\n") ?? []) {
    const line = rawLine.replace(/\r$/, "")
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (field) result[field[1]] = stripOuterQuotes(field[2].trim())
  }
  return result
}

function stripOuterQuotes(value: string): string {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  return (first === `"` || first === "'") && first === last ? value.slice(1, -1) : value
}

function runtimeSkillNames(): string[] {
  const content = readFileSync(INDEX_PATH, "utf-8")
  const block = content.match(/export const SKILL_ENTRIES:[\s\S]*?\n\]/)
  expect(block, "src/index.ts must expose SKILL_ENTRIES").not.toBeNull()
  return [...(block?.[0] ?? "").matchAll(/name:\s*"([^"]+)"/g)].map((match) => match[1])
}

test("all sourced skill directories exist", () => {
  for (const name of expectedSkills) {
    expect(existsSync(join(SKILLS_DIR, name)), `missing skill directory: ${name}`).toBe(true)
    expect(existsSync(join(SKILLS_DIR, name, "SKILL.md")), `missing SKILL.md: ${name}`).toBe(true)
  }
})

describe("SKILL.md frontmatter", () => {
  for (const source of sources.skills) {
    test(`${source.name} has stable public identity`, () => {
      const frontmatter = readFrontmatter(source.name)
      expect(frontmatter.name).toBe(source.name)
      expect(frontmatter.description?.length ?? 0).toBeGreaterThan(0)
    })
  }
})

test("plugin.json contributes all skills in source order", () => {
  const plugin = JSON.parse(readFileSync(PLUGIN_JSON_PATH, "utf-8"))
  const actual = plugin.contributes.skills.map((skill: { name: string }) => skill.name)
  expect(actual).toEqual(expectedSkills)
})

test("runtime contributes all skills in source order", () => {
  expect(runtimeSkillNames()).toEqual(expectedSkills)
})

test("no orphan skill directories exist", () => {
  const onDisk = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  expect(onDisk).toEqual([...expectedSkills].sort())
})

test("declared license files are bundled", () => {
  for (const source of sources.skills) {
    for (const licenseFile of source.licenseFiles ?? []) {
      expect(
        existsSync(join(SKILLS_DIR, source.name, licenseFile)),
        `${source.name} must include ${licenseFile}`,
      ).toBe(true)
    }
  }
})

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
  ]

  const output = renderSetupResult(steps, { "dry-run": true, json: true })
  const parsed = JSON.parse(output)
  expect(parsed.plugin).toBe("synergy-frontend-kit")
  expect(parsed.dryRun).toBe(true)
  expect(parsed.steps[0].id).toBe("shadcn")
})
