#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { SKILL_ENTRIES } from "../src/skills";

interface SkillSource {
  name: string;
  aliases?: string[];
  licenseFiles?: string[];
}

interface SourcesFile {
  skills: SkillSource[];
}

const ROOT = join(import.meta.dir, "..");
const SKILLS_DIR = join(ROOT, "skills");
const SOURCES_PATH = join(ROOT, "skills.sources.json");
const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function stripOuterQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  return (first === `"` || first === "'") && first === last
    ? value.slice(1, -1)
    : value;
}

function parseFrontmatter(
  content: string,
  file: string,
): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    fail(`${file}: missing YAML frontmatter`);
    return {};
  }
  const fields: Record<string, string> = {};
  for (const rawLine of match[1].split("\n")) {
    const field = rawLine
      .replace(/\r$/, "")
      .match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) fields[field[1]] = stripOuterQuotes(field[2].trim());
  }
  return fields;
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
const expectedNames = sources.skills.map((source) => source.name);
const expectedSet = new Set(expectedNames);
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
  const frontmatter = parseFrontmatter(
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
  for (const markdown of collectMarkdownFiles(skillDir))
    verifyMarkdownLinks(markdown, skillDir);
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
