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

## Keeping Skills Updated

```bash
# See what would change
synergy frontend-kit update --dry-run

# Apply updates
synergy frontend-kit update

# Or run directly
bash scripts/update.sh
```

> **Note:** After updating skills, reload Synergy with `runtime_reload(target: "skill")` to pick up the changes.

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

The `update.sh` script clones from external Git repositories (`anthropics/skills`, `Leonxlnx/taste-skill`) to sync skill content. These are trusted community projects, but the script only copies markdown files — no executable code is pulled from upstream.

## License

MIT
