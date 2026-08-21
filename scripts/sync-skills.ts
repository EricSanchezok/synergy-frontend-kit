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
  dependencies?: string[]
  source: SourceFile
  license?: string
  licenseFiles?: string[]
  allowLocalPatch?: boolean
}

interface SourcesFile {
  schemaVersion: number
  skills: SkillSource[]
}

interface LockedSource {
  repo: string
  ref: string
  commit: string
}

interface SkillsLock {
  schemaVersion: number
  generatedAt: string
  sources: Record<string, LockedSource>
}

interface DiffSummary {
  added: number
  modified: number
  removed: number
}

const ROOT = join(import.meta.dir, "..")
const SKILLS_DIR = join(ROOT, "skills")
const SOURCES_PATH = join(ROOT, "skills.sources.json")
const LOCK_PATH = join(ROOT, "skills.lock.json")
const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const quiet = args.has("--quiet")
const refreshLock = args.has("--refresh-lock")
const tempDir = mkdtempSync(join(tmpdir(), "synergy-frontend-kit-sync-"))
const repoCache = new Map<string, string>()
const resolvedSourceCache = new Map<string, LockedSource>()

function log(message: string) {
  if (!quiet) console.log(message)
}

function readSources(): SourcesFile {
  return JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile
}

function readLock(): SkillsLock {
  if (!existsSync(LOCK_PATH)) {
    return { schemaVersion: 1, generatedAt: "", sources: {} }
  }
  return JSON.parse(readFileSync(LOCK_PATH, "utf-8")) as SkillsLock
}

const sourceLock = readLock()
const nextLockedSources: Record<string, LockedSource> = refreshLock
  ? {}
  : { ...sourceLock.sources }

function run(command: string[], cwd = ROOT, attempts = 1) {
  let lastError = ""
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = spawnSync(command[0], command.slice(1), {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    if (result.status === 0) return result.stdout.trim()
    lastError = result.stderr.trim() || result.stdout.trim()
    if (attempt < attempts) log(`  retrying network operation (${attempt + 1}/${attempts})`)
  }
  throw new Error(`${command.join(" ")}\n${lastError}`)
}

function sourceKey(source: SourceFile): string {
  if (!source.repo) throw new Error("git source is missing repo")
  return `${source.repo}#${source.ref ?? "HEAD"}`
}

function resolveRemoteCommit(source: SourceFile): string {
  if (!source.repo) throw new Error("git source is missing repo")
  const ref = source.ref ?? "HEAD"
  const candidates = ref === "HEAD"
    ? ["HEAD"]
    : [`refs/heads/${ref}`, `refs/tags/${ref}^{}`, `refs/tags/${ref}`, ref]
  const output = run(
    ["git", "-c", "http.version=HTTP/1.1", "ls-remote", source.repo, ...candidates],
    ROOT,
    3,
  )
  const entries = output
    .split("\n")
    .map((line) => line.trim().split(/\s+/, 2))
    .filter(([commit, name]) => /^[0-9a-f]{40}$/.test(commit) && Boolean(name))
  const preferred = entries.find(([, name]) => name === `refs/heads/${ref}`)
    ?? entries.find(([, name]) => name === `refs/tags/${ref}^{}`)
    ?? entries.find(([, name]) => name === `refs/tags/${ref}`)
    ?? entries[0]
  if (!preferred) throw new Error(`Unable to resolve ${source.repo}#${ref}`)
  return preferred[0]
}

function resolveLockedSource(source: SourceFile): LockedSource {
  if (!source.repo) throw new Error("git source is missing repo")
  const key = sourceKey(source)
  const cached = resolvedSourceCache.get(key)
  if (cached) return cached
  const ref = source.ref ?? "HEAD"
  if (refreshLock) {
    const locked = { repo: source.repo, ref, commit: resolveRemoteCommit(source) }
    nextLockedSources[key] = locked
    resolvedSourceCache.set(key, locked)
    return locked
  }
  const locked = sourceLock.sources[key]
  if (!locked || !/^[0-9a-f]{40}$/.test(locked.commit)) {
    throw new Error(`Missing locked commit for ${key}; run bash scripts/update.sh`)
  }
  resolvedSourceCache.set(key, locked)
  return locked
}

function cloneRepo(source: SourceFile): string {
  if (!source.repo) throw new Error("git source is missing repo")

  const locked = resolveLockedSource(source)
  const cacheKey = `${source.repo}#${locked.commit}`
  const cached = repoCache.get(cacheKey)
  if (cached) return cached

  const repoName = basename(source.repo.replace(/\.git$/, ""))
  const checkout = join(tempDir, `${repoName}-${repoCache.size}`)

  run(["git", "init", "--quiet", checkout])
  run(["git", "remote", "add", "origin", source.repo], checkout)
  run(
    ["git", "-c", "http.version=HTTP/1.1", "fetch", "--depth", "1", "--quiet", "origin", locked.commit],
    checkout,
    3,
  )
  run(["git", "checkout", "--quiet", "FETCH_HEAD"], checkout)

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
  const explicitOnly = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter)
  let normalizedFrontmatter = frontmatter
    .replace(/^name:\s*.+$/m, `name: ${targetName}`)
    .replace(/^disable-model-invocation:\s*(?:true|false)\s*\r?\n?/m, "")

  const topLevelVersion = normalizedFrontmatter.match(/^version:\s*(.+)\s*$/m)
  if (topLevelVersion) {
    if (/^metadata:\s*$/m.test(normalizedFrontmatter)) {
      normalizedFrontmatter = normalizedFrontmatter
        .replace(/^version:\s*.+\s*\r?\n?/m, "")
        .replace(/^metadata:\s*$/m, `metadata:\n  version: ${topLevelVersion[1]}`)
    } else {
      normalizedFrontmatter = normalizedFrontmatter.replace(
        /^version:\s*.+\s*$/m,
        `metadata:\n  version: ${topLevelVersion[1]}`,
      )
    }
  }

  if (explicitOnly) {
    const openAiPath = join(skillDir, "agents", "openai.yaml")
    const openAi = existsSync(openAiPath) ? readFileSync(openAiPath, "utf-8") : ""
    if (!/^\s*allow_implicit_invocation:\s*false\s*$/m.test(openAi)) {
      throw new Error(
        `${targetName}: disable-model-invocation requires agents/openai.yaml policy.allow_implicit_invocation: false`,
      )
    }
  }
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

if (refreshLock && !dryRun) {
  const sortedSources = Object.fromEntries(
    Object.entries(nextLockedSources).sort(([left], [right]) => left.localeCompare(right)),
  )
  const previousSources = JSON.stringify(sourceLock.sources)
  const nextSources = JSON.stringify(sortedSources)
  const lock: SkillsLock = {
    schemaVersion: 1,
    generatedAt: previousSources === nextSources && sourceLock.generatedAt
      ? sourceLock.generatedAt
      : new Date().toISOString(),
    sources: sortedSources,
  }
  writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, "utf-8")
  log(`Updated ${relative(ROOT, LOCK_PATH)}`)
}
