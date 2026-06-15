<p align="center">
  <img src="https://img.shields.io/badge/synergy-%E2%89%A52.1.4-6366f1" alt="Synergy">
  <img src="https://img.shields.io/badge/bun-%E2%89%A51.2.0-f9f5e9" alt="Bun">
  <img src="https://img.shields.io/badge/license-MIT-22c55e" alt="License">
  <img src="https://img.shields.io/badge/skills-10-8b5cf6" alt="Skills">
  <img src="https://img.shields.io/badge/MCP-3-3b82f6" alt="MCP">
</p>

<br>

<p align="center">
  <b>Design skills, a specialist agent, and a verified MCP stack —</b><br>
  <b>everything Synergy needs to build frontend that doesn't look AI-generated.</b>
</p>

---

## Why this exists

AI coding agents produce frontend that looks the same. Generic card grids. Purple gradients. Inter font. No visual hierarchy. No opinion.

This plugin gives Synergy agents **taste**. It doesn't just tell them to "make it pretty" — it gives them a design methodology, a constraint system, 24 anti-slop coding rules, and automated quality checks. The result: UIs that feel designed, not generated.

---

## What's inside

<table>
<tr>
<td width="80" align="center" valign="top"><br>🎯<br><br></td>
<td>

### Design Skills

**10 methodology and execution skills** injected into every session — from high-level design thinking down to concrete coding rules. The agent auto-detects missing tooling and initializes it before starting work.

</td>
</tr>
<tr>
<td width="80" align="center" valign="top"><br>🤖<br><br></td>
<td>

### Specialist Agent

`frontend-designer` is a **subagent** that owns visual decisions end-to-end. It follows a 7-step process (analyze → choose direction → plan hierarchy → structure → typography → color → polish), knows exactly which anti-patterns to avoid, and delivers a self-review checklist before declaring done.

</td>
</tr>
<tr>
<td width="80" align="center" valign="top"><br>🔧<br><br></td>
<td>

### MCP Stack

Three servers, auto-started on plugin load, zero config needed:

| Server | What it enables |
|--------|----------------|
| **shadcn** | Browse, search, and install components — no more generating shadcn from memory |
| **layout-context** | Design system enforcement — catch hardcoded colors, wrong spacing, undefined tokens |
| **playwright** | Screenshots, visual verification, accessibility testing — see what you actually built |

</td>
</tr>
<tr>
<td width="80" align="center" valign="top"><br>⚡<br><br></td>
<td>

### One-Command Install

```bash
synergy plugin add github:EricSanchezok/synergy-frontend-kit
```

That's it. Skills load automatically. The `frontend-designer` agent is available for delegation. MCP servers start on plugin load. The agent self-diagnoses and initializes missing project tooling on its first design task.

> **Note:** MCP servers contributed by plugins require a server restart after the first install (Synergy-core limitation — tracked for fix).

</td>
</tr>
</table>

---

## Install

```bash
synergy plugin add github:EricSanchezok/synergy-frontend-kit
```

### Upgrade

Skill content is bundled with the plugin. When upstream skills are updated, we release a new version:

```bash
synergy plugin update frontend-kit
```

---

## Skills

| Skill | Source | Focus | Lines |
|-------|--------|-------|-------|
| **project-init** | [Synergy](https://github.com/EricSanchezok/synergy-frontend-kit) | Self-diagnose and auto-initialize MCP tooling before design work | 62 |
| **frontend-design** | [Anthropic](https://github.com/anthropics/skills) | Design methodology: plan-before-code, declarative-first, atomic refinement | 55 |
| **taste-frontend** | [Taste Skill v2](https://github.com/Leonxlnx/taste-skill) | Design system: typography scales, spacing grids, color theory, visual hierarchy | 1,206 |
| **color-expert** | [meodai/color-expert](https://github.com/meodai/skill.color-expert) | Color science: OKLCH color spaces, palette generation, APCA/WCAG contrast, 144 reference files | 277 |
| **typography** | [petekp/agent-skills](https://github.com/petekp/agent-skills) | Bringhurst principles: font pairing, 6 type scales, variable fonts, CJK/RTL i18n | 444 |
| **motion-design** | [LottieFiles](https://github.com/LottieFiles/motion-design-skill) | Disney's 12 principles for UI, motion personality archetypes, duration/easing tables | 315 |
| **implementation-rules** | [Synergy](https://github.com/EricSanchezok/synergy-frontend-kit) | 24 anti-slop coding rules extracted from [Impeccable](https://github.com/pbakaus/impeccable) | 50 |
| **a11y-audit** | [snapsynapse/skill-a11y-audit](https://github.com/snapsynapse/skill-a11y-audit) | WCAG 2.1 AA scanning: axe-core + Puppeteer, delta tracking, structured reports | 425 |
| **soft-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Premium, gentle interfaces — rounded corners, soft shadows, warm palettes, generous whitespace | 98 |
| **minimalist-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Reductive design — essential elements only, negative space as a feature, typography-driven layouts | 85 |

---

## Credits

Skills are sourced and adapted from community projects:

| Upstream Project | License | What we include |
|-----------------|---------|----------------|
| [Anthropic Skills](https://github.com/anthropics/skills) | Apache 2.0 | `frontend-design` SKILL.md |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | MIT | `taste-frontend`, `soft-design`, `minimalist-design` SKILL.md |
| [Impeccable](https://github.com/pbakaus/impeccable) | MIT | 24 anti-slop rules extracted into `implementation-rules` |
| [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert) | Apache 2.0 | `color-expert` SKILL.md |
| [petekp/agent-skills](https://github.com/petekp/agent-skills) | MIT | `typography` SKILL.md |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | MIT | `motion-design` SKILL.md |
| [snapsynapse/skill-a11y-audit](https://github.com/snapsynapse/skill-a11y-audit) | MIT | `a11y-audit` SKILL.md |

`project-init` and `frontend-designer` are original to this project.

---

## Configuration

Disable specific skills or MCP servers in your `synergy.jsonc`:

```jsonc
{
  "pluginConfig": {
    "frontend-kit": {
      "enabledSkills": [
        "project-init",
        "frontend-design",
        "taste-frontend",
        "color-expert",
        "typography",
        "motion-design",
        "implementation-rules",
        "a11y-audit",
        "soft-design",
        "minimalist-design"
      ],
      "mcp": {
        "shadcn": true,
        "layoutContext": true,
        "playwright": true
      }
    }
  }
}
```

---

## How the agent works

The `frontend-designer` subagent follows a strict pipeline:

```
analyze brief → choose direction → plan hierarchy →
structure (HTML + Tailwind layout) → typography →
color (2-3 core, token-first) → polish (2-3 intentional animations)
```

**Anti-patterns it refuses:**
- Generic SaaS card grids as the first impression
- Purple/blue default colors without justification
- Cards used for layout (cards = interactive containers only)
- Lorem ipsum placeholder text
- Abstract gradient hero sections with no visual identity
- Button-heavy layouts without clear information hierarchy
- Missing mobile breakpoints
- Missing loading, empty, and error states

**Quality gates before delivering:**
- Works at 320px, 768px, 1024px, 1440px
- All interactives have focus rings
- Color contrast ≥ 4.5:1 (WCAG AA)
- Images have alt text, forms have labels
- No layout shift on load
- Dark mode considered
- No console errors

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Synergy Runtime                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Design Skills│  │frontend-     │  │  MCP Stack   ││
│  │ (10 SKILL.md)│  │designer      │  │  shadcn      ││
│  │              │  │subagent      │  │  layout-     ││
│  │ Injected into│  │              │  │  context     ││
│  │ every session│  │ Delegated for│  │  playwright  ││
│  │              │  │ design tasks │  │              ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘│
│         │                 │                  │       │
│         ▼                 ▼                  ▼       │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Agent produces polished UI              │ │
│  │  → follows design methodology                   │ │
│  │  → uses real components (not generated)         │ │
│  │  → validates against design tokens              │ │
│  │  → visually verifies output                     │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## For maintainers

Sync bundled skills with upstream repos:

```bash
bash scripts/update.sh --dry-run   # preview changes
bash scripts/update.sh              # apply updates
```

Then commit, tag, and release. Users upgrade via `synergy plugin update frontend-kit`.

---

## Requirements

- Synergy ≥ 2.1.4
- Bun ≥ 1.2.0
- Node.js (for `npx` MCP servers)

---

## Security

This plugin runs `npx` with `@latest` tags for MCP servers and setup commands. The packages are well-maintained (`shadcn`, `@playwright/mcp` by Microsoft, `@layoutdesign/context`) but review their supply chain before installing. Pin versions in your own MCP config if you need reproducibility.

---

## License

MIT
