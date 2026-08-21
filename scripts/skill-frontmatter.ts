export interface SkillFrontmatter {
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

function stripOuterQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  return (first === `"` || first === "'") && first === last
    ? value.slice(1, -1)
    : value;
}

function foldBlockScalar(lines: string[], style: ">" | "|"): string {
  const normalized = lines.map((line) => line.trim());
  if (style === "|") return normalized.join("\n").trim();

  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of normalized) {
    if (line) {
      current.push(line);
      continue;
    }
    if (current.length) paragraphs.push(current.join(" "));
    current = [];
  }
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs.join("\n").replace(/\s+/g, " ").trim();
}

export function parseSkillFrontmatter(
  content: string,
  file = "SKILL.md",
): SkillFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Missing YAML frontmatter in ${file}`);

  const lines = match[1].split(/\r?\n/);
  const fields: SkillFrontmatter = {};

  for (let index = 0; index < lines.length; index++) {
    const field = lines[index].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;

    const [, key, rawValue] = field;
    const scalar = rawValue.trim();
    const block = scalar.match(/^([>|])[+-]?$/);
    if (!block) {
      fields[key] = stripOuterQuotes(scalar);
      continue;
    }

    const blockLines: string[] = [];
    while (index + 1 < lines.length) {
      const next = lines[index + 1];
      if (next && !/^\s/.test(next)) break;
      blockLines.push(next);
      index += 1;
    }
    fields[key] = foldBlockScalar(blockLines, block[1] as ">" | "|");
  }

  return fields;
}
