# Security

Synergy Frontend Kit is an official plugin, but it still asks for meaningful capabilities. Treat those capabilities plainly.

## Requested Capabilities

The plugin manifest declares:

- `shell: true`
- `filesystem: write`
- `network: true`
- `mcp: spawn`
- plugin-scoped config access
- trusted plugin UI import for settings and the workspace panel

These are required because the setup command runs project-initialization commands and the plugin contributes local MCP servers.

## Setup Command

`synergy synergy-frontend-kit setup` can run:

```bash
npx -y shadcn@4.11.0 init -d
npx -y @layoutdesign/context@0.15.3 init
npx -y playwright@1.61.1 install --with-deps chromium
```

This can write files in the current project and download packages. Agents should ask the user before running setup in a workspace. Use `--dry-run --json` to inspect the exact commands first.

## MCP Servers

MCP servers are lazy-started and version pinned:

- `shadcn@4.11.0`
- `@layoutdesign/context@0.15.3`
- `@playwright/mcp@0.0.76`

Do not change these back to `@latest` in committed API3 definitions or setup code. If a version changes, update `src/index.ts`, `src/setup.ts`, README, and release notes together.

## Skill Bundles

Upstream skill content is treated as untrusted documentation and helper code. The sync pipeline copies the declared bundle files and verifies local links, but maintainers must still review upstream diffs before release.

Run:

```bash
bash scripts/update.sh --dry-run
bun run verify:skills
```

Review any changed scripts under bundled skill directories before publishing.

## Reporting Issues

Open a GitHub issue in the official repository:

```text
https://github.com/EricSanchezok/synergy-frontend-kit/issues
```

For sensitive reports, contact EricSanchez privately before publishing exploit details.
