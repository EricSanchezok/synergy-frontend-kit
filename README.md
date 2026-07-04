# Synergy Frontend Kit

Official frontend capability kit for Synergy agents.

It bundles curated design skills, pinned MCP servers, setup automation, and a small Synergy UI surface for checking design readiness. The goal is simple: Synergy should build frontend with real taste, real components, and real verification instead of default AI-looking UI.

## Requirements

- Synergy `>=2.4.3`
- Bun `>=1.2.0`
- Node.js and `npx` for MCP servers and setup commands

## Install

After the official marketplace entry is merged:

```bash
synergy plugin add synergy-frontend-kit
```

Direct GitHub installation is useful before the marketplace PR has merged:

```bash
synergy plugin add github:EricSanchezok/synergy-frontend-kit
```

## What It Provides

### Skills

The plugin exposes 10 bundled Agent Skills:

| Skill | Purpose |
| --- | --- |
| `project-init` | Self-diagnose and initialize missing frontend tooling |
| `frontend-design` | Distinctive design methodology for new UI and redesigns |
| `taste-frontend` | Anti-slop frontend guidance for landing pages and portfolios |
| `color-expert` | Color science, palettes, contrast, OKLCH, print/screen color |
| `typography` | Type systems, font loading, OpenType, i18n typography |
| `motion-design` | UI motion principles, timing, easing, and choreography |
| `implementation-rules` | Deterministic anti-slop frontend coding rules |
| `a11y-audit` | WCAG 2.1 AA audit workflow with scripts and reporting |
| `soft-design` | Premium high-end visual design guidance |
| `minimalist-design` | Clean editorial/minimalist interface guidance |

### MCP Servers

MCP startup is lazy by default and versions are pinned for reproducibility:

| Server | Version | Command |
| --- | ---: | --- |
| shadcn/ui | `4.11.0` | `npx -y shadcn@4.11.0 mcp` |
| layout.design | `0.15.3` | `npx -y @layoutdesign/context@0.15.3 serve` |
| Playwright MCP | `0.0.76` | `npx -y @playwright/mcp@0.0.76` |

### CLI

```bash
synergy synergy-frontend-kit setup
synergy synergy-frontend-kit setup --dry-run
synergy synergy-frontend-kit setup --dry-run --json
```

The setup command initializes shadcn/ui, layout.design, and Playwright Chromium with pinned versions. It can write project files and run shell commands, so agents should ask before using it in a user workspace.

### UI

The plugin contributes:

- `Frontend Kit` settings section
- `Design Readiness` workbench panel

The panel is intentionally read-only: it shows status, commands, versions, and next checks without directly running shell setup.

## Non-Synergy Skill Install

The skills are still usable by other Agent Skills-compatible tools:

```bash
npx skills add EricSanchezok/synergy-frontend-kit --all
```

## Configuration

Synergy plugin config defaults:

```jsonc
{
  "pluginConfig": {
    "synergy-frontend-kit": {
      "mcp": {
        "shadcn": true,
        "layoutContext": true,
        "playwright": true,
        "startup": "lazy",
        "timeoutMs": 120000
      },
      "setup": {
        "autoPrompt": true,
        "visualVerification": "smoke"
      }
    }
  }
}
```

## Syncing Upstream Skills

One-command upstream sync is a hard compatibility guarantee for this repository.

```bash
bash scripts/update.sh --dry-run
bash scripts/update.sh
```

The sync source of truth is `skills.sources.json`. It records each upstream repo, ref, bundle path, included files, license files, aliases, and local patch policy.

The sync command:

1. Clones upstream repositories.
2. Copies full skill bundles, including references, scripts, assets, and licenses.
3. Normalizes public skill names to this plugin's stable names.
4. Syncs descriptions into `src/index.ts` and `plugin.json`.
5. Runs bundle verification.

## Verification

```bash
bun install
bun run verify:skills
bun run validate:manifest
bun test
bun run typecheck
bun run validate:plugin
bun run build:plugin
bun run pack:plugin
```

Plugin authoring commands come from `@ericsanchezok/synergy-plugin-kit >=2.4.4`. Use `synergy-plugin ...` or the package scripts for validation, build, pack, sign, and marketplace publishing. Use the Synergy CLI for runtime install and local registry smoke tests.

## Official Release

See [docs/RELEASE.md](docs/RELEASE.md).

The official marketplace path is:

```bash
synergy-plugin publish-market \
  --repo https://github.com/EricSanchezok/synergy-frontend-kit \
  --changelog "Release notes for this version"
```

That command validates, builds, packs, signs, uploads or checks GitHub Release assets, writes the `SII-Holos/synergy-plugins` entry, regenerates `registry.json`, validates the registry, and opens or prepares the PR. Because this is an official Synergy plugin, the registry PR should mark the entry `official: true` and `verified: true` after maintainer review.

## Security

See [SECURITY.md](SECURITY.md).

This plugin declares shell, filesystem write, network, and MCP spawn permissions because setup commands and MCP servers need them. Runtime UI surfaces do not execute setup directly.

## License

MIT. Bundled skills keep their upstream licenses and provenance in `skills.sources.json` and included license files.
