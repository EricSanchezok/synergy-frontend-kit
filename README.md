<p align="center">
  <img src="https://img.shields.io/badge/synergy-%E2%89%A51.1.26-6366f1" alt="Synergy">
  <img src="https://img.shields.io/badge/bun-%E2%89%A51.2.0-f9f5e9" alt="Bun">
  <img src="https://img.shields.io/badge/license-MIT-22c55e" alt="License">
  <img src="https://img.shields.io/badge/skills-4-8b5cf6" alt="Skills">
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

This plugin gives Synergy agents **taste**. It doesn't just tell them to "make it pretty" — it gives them a design methodology, a constraint system, a component library, and automated quality checks. The result: UIs that feel designed, not generated.

---

## What's inside

<table>
<tr>
<td width="80" align="center" valign="top"><br>🎯<br><br></td>
<td>

### Design Skills

**4 methodology skills** injected into every session. Anthropic's `frontend-design` teaches planning-first, atomic refinement. Taste Skill v2 adds systematic design sensibility — typography, spacing, color theory, visual hierarchy. Two additional variants: `soft-design` for premium, gentle interfaces, and `minimalist-design` for content-first, reductive layouts.

Every skill comes with explicit **anti-pattern bans**: no generic card grids, no default purple, no placeholder text, no animation for decoration.

</td>
</tr>
<tr>
<td width="80" align="center" valign="top"><br>🤖<br><br></td>
<td>

### Specialist Agent

`frontend-designer` is a **subagent** that owns visual decisions end-to-end. It follows a 7-step process (analyze → choose direction → plan hierarchy → structure → typography → color → polish), knows exactly which anti-patterns to avoid, and delivers a self-review checklist before declaring done. Not a generalist that happens to write CSS — a designer that also writes code.

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

### One-Command Setup

```bash
synergy frontend-kit setup
```

That's it. Initializes shadcn/ui, layout.design, and Playwright in your project. Each step individually guarded — one failure doesn't block the others. Clear fallback commands printed for anything that needs manual attention.

</td>
</tr>
</table>

---

## Install

```bash
synergy plugin add EricSanchezok/synergy-frontend-kit
```

Then initialize your project:

```bash
synergy frontend-kit setup
```

Skills load automatically. The `frontend-designer` agent is available for delegation. MCP servers start on plugin load.

### Upgrade

Skill content is bundled with the plugin. When upstream skills are updated, we release a new version:

```bash
synergy plugin update frontend-kit
```

---

## Skills

| Skill | Source | Focus | Lines |
|-------|--------|-------|-------|
| **frontend-design** | [Anthropic](https://github.com/anthropics/skills) | Design methodology: plan-before-code, declarative-first, atomic refinement | 55 |
| **taste-frontend** | [Taste Skill v2](https://github.com/Leonxlnx/taste-skill) | Design system: typography scales, spacing grids, color theory, visual hierarchy | 1,206 |
| **soft-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Premium, gentle interfaces — rounded corners, soft shadows, warm palettes, generous whitespace | 98 |
| **minimalist-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Reductive design — essential elements only, negative space as a feature, typography-driven layouts | 85 |

---

## Configuration

Disable specific skills or MCP servers in your `synergy.jsonc`:

```jsonc
{
  "pluginConfig": {
    "frontend-kit": {
      "enabledSkills": [
        "frontend-design",
        "taste-frontend",
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
│  │ (4 SKILL.md) │  │designer      │  │  shadcn      ││
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

- Synergy ≥ 1.1.26
- Bun ≥ 1.2.0
- Node.js (for `npx` MCP servers)

---

## Security

This plugin runs `npx` with `@latest` tags for MCP servers and setup commands. The packages are well-maintained (`shadcn`, `@playwright/mcp` by Microsoft, `@layoutdesign/context`) but review their supply chain before installing. Pin versions in your own MCP config if you need reproducibility.

---

## License

MIT
