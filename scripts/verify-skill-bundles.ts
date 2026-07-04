#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, normalize, relative } from "node:path"

interface SkillSource {
  name: string
  aliases?: string[]
  licenseFiles?: string[]
}

interface SourcesFile {
  skills: SkillSource[]
}

interface PluginSkill {
  name: string
  description: string
  dir: string
}

const ROOT = join(import.meta.dir, "..")
const SKILLS_DIR = join(ROOT, "skills")
const SOURCES_PATH = join(ROOT, "skills.sources.json")
const PLUGIN_JSON_PATH = join(ROOT, "plugin.json")
const INDEX_PATH = join(ROOT, "src", "index.ts")

const failures: string[] = []

function fail(message: string) {
  failures.push(message)
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T
}

function stripOuterQuotes(value: string): string {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  return (first === `"` || first === "'") && first === last ? value.slice(1, -1) : value
}

function parseFrontmatter(content: string, file: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) {
    fail(`${file}: missing YAML frontmatter`)
    return {}
  }

  const fields: Record<string, string> = {}
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.replace(/\r$/, "")
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (field) fields[field[1]] = stripOuterQuotes(field[2].trim())
  }
  return fields
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "deps" || entry.name === ".git") continue
      const abs = join(current, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(abs)
    }
  }

  walk(dir)
  return files
}

function isExternalLink(target: string): boolean {
  return (
    target === "" ||
    target.startsWith("#") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:") ||
    target.startsWith("tel:")
  )
}

function cleanTarget(raw: string): string {
  const withoutTitle = raw.trim().split(/\s+["'][^"']+["']$/)[0]
  const withoutHash = withoutTitle.split("#")[0]
  return withoutHash.replace(/^<|>$/g, "")
}

function isVerifiableTarget(target: string): boolean {
  if (!target) return false
  if (target.includes("/pdfs/") || target.startsWith("pdfs/")) return false
  if (/\.pdf$/i.test(target)) return false
  return target.includes("/") || /\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|css|html|txt)$/i.test(target)
}

function assertLocalTarget(file: string, skillRoot: string, target: string) {
  if (isExternalLink(target)) return
  const clean = cleanTarget(target)
  if (isExternalLink(clean)) return
  if (!isVerifiableTarget(clean)) return

  let decoded = clean
  try {
    decoded = decodeURIComponent(clean)
  } catch {
    decoded = clean
  }

  const relativeToFile = normalize(join(dirname(file), decoded))
  const relativeToSkill = normalize(join(skillRoot, decoded))
  const relativeToReferences = normalize(join(skillRoot, "references", decoded))
  if (!existsSync(relativeToFile) && !existsSync(relativeToSkill) && !existsSync(relativeToReferences)) {
    fail(`${relative(ROOT, file)}: missing linked resource ${target}`)
  }
}

function verifyMarkdownLinks(file: string, skillRoot: string) {
  const content = readFileSync(file, "utf-8")

  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    assertLocalTarget(file, skillRoot, match[1])
  }

  for (const match of content.matchAll(/`((?:references|scripts|director|reference|patterns|assets)\/[^`\s]+)`/g)) {
    assertLocalTarget(file, skillRoot, match[1])
  }
}

function extractRuntimeSkillNames(): string[] {
  const content = readFileSync(INDEX_PATH, "utf-8")
  const block = content.match(/export const SKILL_ENTRIES:[\s\S]*?\n\]/)
  if (!block) {
    fail("src/index.ts: missing SKILL_ENTRIES generated block")
    return []
  }
  return [...block[0].matchAll(/name:\s*"([^"]+)"/g)].map((match) => match[1])
}

const sources = readJson<SourcesFile>(SOURCES_PATH)
const expectedNames = sources.skills.map((source) => source.name)
const expectedSet = new Set(expectedNames)
const plugin = readJson<{ contributes?: { skills?: PluginSkill[] } }>(PLUGIN_JSON_PATH)
const manifestSkills = plugin.contributes?.skills ?? []
const manifestNames = manifestSkills.map((skill) => skill.name)
const runtimeNames = extractRuntimeSkillNames()

if (JSON.stringify(manifestNames) !== JSON.stringify(expectedNames)) {
  fail(`plugin.json skill order mismatch: expected ${expectedNames.join(", ")}, got ${manifestNames.join(", ")}`)
}

if (JSON.stringify(runtimeNames) !== JSON.stringify(expectedNames)) {
  fail(`src/index.ts skill order mismatch: expected ${expectedNames.join(", ")}, got ${runtimeNames.join(", ")}`)
}

for (const source of sources.skills) {
  const skillDir = join(SKILLS_DIR, source.name)
  const skillMd = join(skillDir, "SKILL.md")

  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    fail(`${source.name}: missing skill directory`)
    continue
  }

  if (!existsSync(skillMd)) {
    fail(`${source.name}: missing SKILL.md`)
    continue
  }

  const frontmatter = parseFrontmatter(readFileSync(skillMd, "utf-8"), relative(ROOT, skillMd))
  if (frontmatter.name !== source.name) {
    const aliases = source.aliases ?? []
    fail(`${source.name}: frontmatter name must be ${source.name}; got ${frontmatter.name || "(missing)"}${aliases.length ? ` (aliases: ${aliases.join(", ")})` : ""}`)
  }

  if (!frontmatter.description) {
    fail(`${source.name}: frontmatter description is missing`)
  }

  for (const licenseFile of source.licenseFiles ?? []) {
    if (!existsSync(join(skillDir, licenseFile))) {
      fail(`${source.name}: missing declared license file ${licenseFile}`)
    }
  }

  for (const markdownFile of collectMarkdownFiles(skillDir)) {
    verifyMarkdownLinks(markdownFile, skillDir)
  }
}

const onDisk = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

for (const dirName of onDisk) {
  if (!expectedSet.has(dirName)) {
    fail(`orphan skill directory: ${dirName}`)
  }
}

if (failures.length > 0) {
  console.error(`Skill bundle verification failed with ${failures.length} issue(s):`)
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Verified ${expectedNames.length} skill bundles`)
