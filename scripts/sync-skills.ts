#!/usr/bin/env bun
import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import { tmpdir } from "node:os"

interface SourceFile {
  type: "local" | "git"
  repo?: string
  ref?: string
  path?: string
  include?: string[]
}

interface SkillSource {
  name: string
  aliases?: string[]
  source: SourceFile
  license?: string
  licenseFiles?: string[]
  allowLocalPatch?: boolean
}

interface SourcesFile {
  schemaVersion: number
  skills: SkillSource[]
}

interface DiffSummary {
  added: number
  modified: number
  removed: number
}

const ROOT = join(import.meta.dir, "..")
const SKILLS_DIR = join(ROOT, "skills")
const SOURCES_PATH = join(ROOT, "skills.sources.json")
const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const quiet = args.has("--quiet")
const tempDir = mkdtempSync(join(tmpdir(), "synergy-frontend-kit-sync-"))
const repoCache = new Map<string, string>()

function log(message: string) {
  if (!quiet) console.log(message)
}

function readSources(): SourcesFile {
  return JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile
}

function run(command: string[], cwd = ROOT) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (result.status !== 0) {
    throw new Error(`${command.join(" ")}\n${result.stderr.trim() || result.stdout.trim()}`)
  }

  return result.stdout.trim()
}

function cloneRepo(source: SourceFile): string {
  if (!source.repo) throw new Error("git source is missing repo")

  const ref = source.ref ?? "HEAD"
  const cacheKey = `${source.repo}#${ref}`
  const cached = repoCache.get(cacheKey)
  if (cached) return cached

  const repoName = basename(source.repo.replace(/\.git$/, ""))
  const checkout = join(tempDir, `${repoName}-${repoCache.size}`)

  try {
    run(["git", "clone", "--depth", "1", "--quiet", "--branch", ref, source.repo, checkout])
  } catch {
    run(["git", "clone", "--depth", "1", "--quiet", source.repo, checkout])
    if (ref !== "HEAD") {
      run(["git", "fetch", "--depth", "1", "origin", ref], checkout)
      run(["git", "checkout", "--quiet", "FETCH_HEAD"], checkout)
    }
  }

  repoCache.set(cacheKey, checkout)
  return checkout
}

function shouldSkip(name: string): boolean {
  return name === ".git" || name === "node_modules" || name === "deps" || name === ".DS_Store"
}

function copyEntry(src: string, dest: string) {
  if (!existsSync(src)) {
    throw new Error(`Missing upstream path: ${src}`)
  }

  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, {
    recursive: true,
    force: true,
    filter(source) {
      return !shouldSkip(basename(source))
    },
  })
}

function normalizeSkillFrontmatter(skillDir: string, targetName: string) {
  const skillPath = join(skillDir, "SKILL.md")
  if (!existsSync(skillPath)) {
    throw new Error(`Missing SKILL.md in staged skill ${targetName}`)
  }

  const content = readFileSync(skillPath, "utf-8")
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${skillPath}`)
  }

  const frontmatter = match[1]
  const normalizedFrontmatter = frontmatter.replace(/^name:\s*.+$/m, `name: ${targetName}`)
  if (frontmatter === normalizedFrontmatter) return

  writeFileSync(
    skillPath,
    `---\n${normalizedFrontmatter}\n---${content.slice(match[0].length)}`,
    "utf-8",
  )
}

function stageSkill(source: SkillSource): string | undefined {
  if (source.source.type === "local") return undefined

  const checkout = cloneRepo(source.source)
  const sourceRoot = join(checkout, source.source.path ?? ".")
  const staged = join(tempDir, "staged", source.name)
  rmSync(staged, { recursive: true, force: true })
  mkdirSync(staged, { recursive: true })

  const includes = source.source.include?.length ? source.source.include : ["."]
  for (const include of includes) {
    const src = join(sourceRoot, include)
    const dest = include === "." ? staged : join(staged, include)
    copyEntry(src, dest)
  }

  normalizeSkillFrontmatter(staged, source.name)
  return staged
}

function collectFiles(dir: string): Map<string, Buffer> {
  const files = new Map<string, Buffer>()
  if (!existsSync(dir)) return files

  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (shouldSkip(entry.name)) continue
      const abs = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
      } else if (entry.isFile()) {
        files.set(relative(dir, abs), readFileSync(abs))
      }
    }
  }

  walk(dir)
  return files
}

function diffDirs(left: string, right: string): DiffSummary {
  const current = collectFiles(left)
  const next = collectFiles(right)
  const diff: DiffSummary = { added: 0, modified: 0, removed: 0 }

  for (const [file, nextContent] of next) {
    const currentContent = current.get(file)
    if (!currentContent) diff.added += 1
    else if (!currentContent.equals(nextContent)) diff.modified += 1
  }

  for (const file of current.keys()) {
    if (!next.has(file)) diff.removed += 1
  }

  return diff
}

function isChanged(diff: DiffSummary): boolean {
  return diff.added > 0 || diff.modified > 0 || diff.removed > 0
}

function applyStagedSkill(staged: string, dest: string) {
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })

  for (const entry of readdirSync(staged)) {
    copyEntry(join(staged, entry), join(dest, entry))
  }
}

function validateLocalSkill(source: SkillSource) {
  const skillDir = join(SKILLS_DIR, source.name)
  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    throw new Error(`Missing local skill directory: ${source.name}`)
  }
  if (!existsSync(join(skillDir, "SKILL.md"))) {
    throw new Error(`Missing local SKILL.md: ${source.name}`)
  }
}

let updated = 0
let unchanged = 0
let failed = 0

try {
  const sources = readSources()

  for (const source of sources.skills) {
    try {
      if (source.source.type === "local") {
        validateLocalSkill(source)
        unchanged += 1
        log(`= ${source.name} (local)`)
        continue
      }

      log(`> ${source.name}`)
      const staged = stageSkill(source)
      if (!staged) throw new Error(`No staged output for ${source.name}`)

      const dest = join(SKILLS_DIR, source.name)
      const diff = diffDirs(dest, staged)

      if (!isChanged(diff)) {
        unchanged += 1
        log("  unchanged")
        continue
      }

      updated += 1
      log(`  ${dryRun ? "would update" : "updated"} (+${diff.added} ~${diff.modified} -${diff.removed})`)
      if (!dryRun) applyStagedSkill(staged, dest)
    } catch (error) {
      failed += 1
      console.error(`! ${source.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

console.log("")
if (dryRun) {
  console.log(`Summary (dry run): ${updated} would update, ${unchanged} unchanged, ${failed} failed`)
  console.log("Run without --dry-run to apply updates.")
} else {
  console.log(`Summary: ${updated} updated, ${unchanged} unchanged, ${failed} failed`)
}

if (failed > 0) process.exit(1)
