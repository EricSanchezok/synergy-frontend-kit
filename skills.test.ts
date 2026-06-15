import { test, expect, describe } from "bun:test"
import { readdirSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const SKILLS_DIR = join(import.meta.dirname, "skills")
const PLUGIN_JSON_PATH = join(import.meta.dirname, "plugin.json")

const EXPECTED_SKILLS = [
  "project-init",
  "frontend-design",
  "taste-frontend",
  "color-expert",
  "typography",
  "motion-design",
  "implementation-rules",
  "a11y-audit",
  "soft-design",
  "minimalist-design",
]

// ---------------------------------------------------------------------------
// Test 1: All expected skill directories exist
// ---------------------------------------------------------------------------
test("all 10 skill directories exist", () => {
  for (const name of EXPECTED_SKILLS) {
    const dir = join(SKILLS_DIR, name)
    expect(existsSync(dir), `missing skill directory: ${name}`).toBe(true)
  }
})

// ---------------------------------------------------------------------------
// Test 2: All SKILL.md files have valid YAML frontmatter
// ---------------------------------------------------------------------------
describe("SKILL.md frontmatter", () => {
  const skillDirs = EXPECTED_SKILLS.filter((name) =>
    existsSync(join(SKILLS_DIR, name))
  )

  for (const name of skillDirs) {
    test(`valid frontmatter in ${name}/SKILL.md`, () => {
      const content = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8")

      // Must start with ---
      expect(
        content.startsWith("---"),
        `${name}/SKILL.md must start with "---"`
      ).toBe(true)

      // Second --- must exist after the opening one (skip past first "---\n")
      const afterOpening = content.slice(4)
      const closingIndex = afterOpening.indexOf("\n---")
      expect(
        closingIndex !== -1,
        `${name}/SKILL.md must have a closing "---"`
      ).toBe(true)

      // Between the --- delimiters, there must be key:value lines
      const frontmatter = afterOpening.slice(0, closingIndex).trim()
      const hasKeyValue = /^\s*\w[\w-]*\s*:/.test(frontmatter)
      expect(
        hasKeyValue,
        `${name}/SKILL.md frontmatter must contain at least one key:value entry`
      ).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// Test 3: plugin.json contains all 10 skills in correct order
// ---------------------------------------------------------------------------
test("plugin.json contributes all 10 skills in order", () => {
  const raw = readFileSync(PLUGIN_JSON_PATH, "utf-8")
  const plugin = JSON.parse(raw)

  const actual = plugin.contributes.skills.map((s: { name: string }) => s.name)

  expect(actual, "skill count mismatch").toHaveLength(EXPECTED_SKILLS.length)

  for (let i = 0; i < EXPECTED_SKILLS.length; i++) {
    expect(
      actual[i],
      `plugin.json skill at index ${i}`
    ).toBe(EXPECTED_SKILLS[i])
  }
})

// ---------------------------------------------------------------------------
// Test 4: No orphan skill directories
// ---------------------------------------------------------------------------
describe("no orphan skill directories", () => {
  // Read plugin.json to build the allowlist
  const raw = readFileSync(PLUGIN_JSON_PATH, "utf-8")
  const plugin = JSON.parse(raw)
  const registeredSkillNames = new Set(
    plugin.contributes.skills.map((s: { name: string }) => s.name)
  )

  const onDisk = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const dirName of onDisk) {
    test(`skill directory ${dirName} is registered`, () => {
      // Every directory in skills/ must have a SKILL.md
      const skillMdPath = join(SKILLS_DIR, dirName, "SKILL.md")
      expect(
        existsSync(skillMdPath),
        `${dirName} directory must contain SKILL.md`
      ).toBe(true)

      // Every directory must be listed in plugin.json
      expect(
        registeredSkillNames.has(dirName),
        `${dirName} is not listed in plugin.json contributes.skills`
      ).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// Test 5: All SKILL.md files are non-empty and above minimum size
// ---------------------------------------------------------------------------
describe("SKILL.md minimum content size", () => {
  const MINIMUM_SIZE = 500

  const skillDirs = EXPECTED_SKILLS.filter((name) =>
    existsSync(join(SKILLS_DIR, name))
  )

  for (const name of skillDirs) {
    test(`${name}/SKILL.md has meaningful content (≥ ${MINIMUM_SIZE} bytes)`, () => {
      const file = join(SKILLS_DIR, name, "SKILL.md")
      const size = readFileSync(file).byteLength
      expect(
        size,
        `${name}/SKILL.md is ${size} bytes, minimum is ${MINIMUM_SIZE}`
      ).toBeGreaterThanOrEqual(MINIMUM_SIZE)
    })
  }
})
