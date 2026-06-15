# synergy-frontend-kit

Professional frontend design capabilities for [Synergy](https://github.com/SII-Holos/synergy) agents.

## What You Get

When installed, Synergy agents gain:

- **🎯 Design Methodology Skills** — Anthropic's frontend design approach + Taste Skill design system
- **🤖 frontend-designer Agent** — A specialized subagent for design-heavy tasks
- **🔧 MCP Tool Chain** — shadcn/ui components, layout.design enforcement, Playwright visual testing
- **⚡ One-Command Setup** — `synergy frontend-kit setup` initializes everything

## Skills Included

| Skill | Source | Focus |
|-------|--------|-------|
| **frontend-design** | [Anthropic](https://github.com/anthropics/skills) | Design methodology: plan-before-code, atomic refinement |
| **taste-frontend** | [Taste Skill v2](https://github.com/Leonxlnx/taste-skill) | Design system: typography, spacing, color theory |
| **soft-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Gentle, approachable interfaces |
| **minimalist-design** | [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Reductive design: essential elements only |

## MCP Servers

| Server | Purpose |
|--------|---------|
| **shadcn** (`npx shadcn@latest mcp`) | Component registry — browse, search, and add shadcn/ui components |
| **layout-context** (`npx @layoutdesign/context serve`) | Design system enforcement — validate tokens, spacing, and color usage |
| **playwright** (`npx @playwright/mcp@latest`) | Visual verification — screenshots, interaction testing, accessibility checks |

## Quick Start

```bash
# Install the plugin
synergy plugin add EricSanchezok/synergy-frontend-kit

# Initialize tooling in your project
synergy frontend-kit setup

# Start designing!
# The frontend-designer agent is now available via delegation
```

## Upgrading

Skill content is bundled with the plugin. When upstream skills are updated, we release a new plugin version. Upgrade to get the latest:

```bash
synergy plugin update frontend-kit
```

## Configuration

In your `synergy.jsonc`:

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

## Requirements

- Synergy >= 1.1.26
- Bun >= 1.2.0
- Node.js (for npx MCP servers)

## Security

This plugin runs `npx` with `@latest` tags for MCP servers and setup commands. Before installing, review the supply chain of these npm packages: `shadcn`, `@playwright/mcp`, `@layoutdesign/context`. Consider pinning versions in your own MCP configuration if you need reproducibility guarantees.

## For Maintainers

To sync bundled skills with upstream repositories:

```bash
# Preview changes
bash scripts/update.sh --dry-run

# Apply updates
bash scripts/update.sh
```

This clones from `anthropics/skills` and `Leonxlnx/taste-skill`, diffs each SKILL.md, and copies updates into `skills/`. After syncing, commit and release a new version. Users upgrade via `synergy plugin update frontend-kit`.

## License

MIT
