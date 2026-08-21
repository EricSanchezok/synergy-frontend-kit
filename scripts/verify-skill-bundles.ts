#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { SKILL_ENTRIES } from "../src/skills";
import { parseSkillFrontmatter } from "./skill-frontmatter";

interface SkillSource {
  name: string;
  aliases?: string[];
  dependencies?: string[];
  source: {
    type: "local" | "git";
    repo?: string;
    ref?: string;
  };
  licenseFiles?: string[];
}

interface SourcesFile {
  skills: SkillSource[];
}

interface SkillsLock {
  schemaVersion: number;
  sources: Record<string, { repo: string; ref: string; commit: string }>;
}

const ROOT = join(import.meta.dir, "..");
const SKILLS_DIR = join(ROOT, "skills");
const SOURCES_PATH = join(ROOT, "skills.sources.json");
const LOCK_PATH = join(ROOT, "skills.lock.json");
const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", "deps", ".git"].includes(entry.name)) continue;
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md"))
        files.push(absolute);
    }
  };
  walk(dir);
  return files;
}

function cleanTarget(raw: string): string {
  return raw
    .trim()
    .split(/\s+["'][^"']+["']$/)[0]
    .split("#")[0]
    .replace(/^<|>$/g, "");
}

function assertLocalTarget(file: string, skillRoot: string, raw: string) {
  if (!raw || raw.startsWith("#") || /^(https?|mailto|tel):/.test(raw)) return;
  if (raw.includes("<") || raw.includes(">")) return;
  const target = cleanTarget(raw);
  if (
    !target ||
    target.includes("/pdfs/") ||
    target.startsWith("pdfs/") ||
    /\.pdf$/i.test(target)
  )
    return;
  if (
    !target.includes("/") &&
    !/\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|css|html|txt)$/i.test(target)
  )
    return;
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {}
  const candidates = [
    join(dirname(file), decoded),
    join(skillRoot, decoded),
    join(skillRoot, "references", decoded),
  ].map(normalize);
  if (!candidates.some(existsSync))
    fail(`${relative(ROOT, file)}: missing linked resource ${raw}`);
}

function verifyMarkdownLinks(file: string, skillRoot: string) {
  const content = readFileSync(file, "utf-8");
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    assertLocalTarget(file, skillRoot, match[1]);
  for (const match of content.matchAll(
    /`((?:references|scripts|director|reference|patterns|assets)\/[^`\s]+)`/g,
  ))
    assertLocalTarget(file, skillRoot, match[1]);
}

const sources = JSON.parse(readFileSync(SOURCES_PATH, "utf-8")) as SourcesFile;
const sourceLock = existsSync(LOCK_PATH)
  ? JSON.parse(readFileSync(LOCK_PATH, "utf-8")) as SkillsLock
  : undefined;
const expectedNames = sources.skills.map((source) => source.name);
const expectedSet = new Set(expectedNames);
const expectedLockKeys = new Set(
  sources.skills
    .filter((source) => source.source.type === "git")
    .map((source) => `${source.source.repo}#${source.source.ref ?? "HEAD"}`),
);
const definitionNames = SKILL_ENTRIES.map((entry) => entry.name);
if (JSON.stringify(definitionNames) !== JSON.stringify(expectedNames)) {
  fail(
    `src/skills.ts order mismatch: expected ${expectedNames.join(", ")}, got ${definitionNames.join(", ")}`,
  );
}

for (const source of sources.skills) {
  const skillDir = join(SKILLS_DIR, source.name);
  const skillMd = join(skillDir, "SKILL.md");
  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    fail(`${source.name}: missing skill directory`);
    continue;
  }
  if (!existsSync(skillMd)) {
    fail(`${source.name}: missing SKILL.md`);
    continue;
  }
  const frontmatter = parseSkillFrontmatter(
    readFileSync(skillMd, "utf-8"),
    relative(ROOT, skillMd),
  );
  if (frontmatter.name !== source.name)
    fail(
      `${source.name}: frontmatter name must be ${source.name}; got ${frontmatter.name || "(missing)"}`,
    );
  if (!frontmatter.description)
    fail(`${source.name}: frontmatter description is missing`);
  for (const licenseFile of source.licenseFiles ?? []) {
    if (!existsSync(join(skillDir, licenseFile)))
      fail(`${source.name}: missing declared license file ${licenseFile}`);
  }
  for (const dependency of source.dependencies ?? []) {
    if (!expectedSet.has(dependency))
      fail(`${source.name}: missing declared skill dependency ${dependency}`);
  }
  if (source.source.type === "git") {
    const ref = source.source.ref ?? "HEAD";
    const key = `${source.source.repo}#${ref}`;
    const locked = sourceLock?.sources[key];
    if (!locked || !/^[0-9a-f]{40}$/.test(locked.commit))
      fail(`${source.name}: missing immutable source lock for ${key}`);
    else if (`${locked.repo}#${locked.ref}` !== key)
      fail(`${source.name}: source lock identity mismatch for ${key}`);
  }
  for (const markdown of collectMarkdownFiles(skillDir))
    verifyMarkdownLinks(markdown, skillDir);
}

if (sourceLock?.schemaVersion !== 1)
  fail("skills.lock.json: schemaVersion must be 1");
for (const key of Object.keys(sourceLock?.sources ?? {})) {
  if (!expectedLockKeys.has(key)) fail(`skills.lock.json: stale source ${key}`);
}

for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
  if (entry.isDirectory() && !expectedSet.has(entry.name))
    fail(`orphan skill directory: ${entry.name}`);
}

if (failures.length) {
  console.error(
    `Skill bundle verification failed with ${failures.length} issue(s):`,
  );
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Verified ${expectedNames.length} skill bundles`);
