# Release Process

This document is the maintainer checklist for publishing Synergy Frontend Kit as an official Synergy plugin.

## Prerequisites

- Synergy Plugin Kit with API3 `definePlugin()` support
- Bun `>=1.2.0`
- `gh` authenticated for release uploads and PR creation, or be ready to follow the printed manual fallback commands
- GitHub write access to `EricSanchezok/synergy-frontend-kit`
- GitHub access to open PRs against `SII-Holos/synergy-plugins`
- The approved SII release signing key at `~/.synergy/keys/signing-key.json`

If `synergy-plugin sign` auto-generates a new local key, treat that key as a development smoke-test key. Do not use it for an official release until the signer has been approved for the registry PR.

## 1. Refresh Upstream Skills

Preview first:

```bash
bash scripts/update.sh --dry-run
```

Apply:

```bash
bash scripts/update.sh
```

Review all changed files, especially bundled `scripts/` directories.

## 2. Verify The Plugin

```bash
bun install
bun run verify:skills
bun test
bun run typecheck
bun run validate:plugin
bun run build:plugin
bun run pack:plugin
```

The equivalent one-command check is:

```bash
bun run release:check
```

Inspect the tarball:

```bash
tar -tzf synergy-frontend-kit-0.2.4.synergy-plugin.tgz | sort
```

Required package files:

```text
plugin.json
runtime/index.js
ui/index.js
integrity.json
permissions.summary.json
skills/
```

## 3. Preferred Official Marketplace Publish

```bash
synergy-plugin publish-market \
  --repo https://github.com/EricSanchezok/synergy-frontend-kit \
  --changelog "Release notes for this version"
```

`publish-market` validates with runtime discovery, builds, packs, signs, uploads or checks GitHub Release assets, updates the local `SII-Holos/synergy-plugins` checkout, regenerates `registry.json`, runs registry validation, and opens or prepares a PR.

To use a prebuilt tarball instead of rebuilding:

```bash
synergy-plugin publish-market synergy-frontend-kit-0.2.4.synergy-plugin.tgz \
  --repo https://github.com/EricSanchezok/synergy-frontend-kit \
  --changelog "Release notes for this version"
```

If you need to inspect or edit the registry change before opening a PR, add `--no-pr`:

```bash
synergy-plugin publish-market \
  --repo https://github.com/EricSanchezok/synergy-frontend-kit \
  --changelog "Release notes for this version" \
  --no-pr
```

For this official SII plugin, check the generated registry entry before PR review finishes:

```json
{
  "id": "synergy-frontend-kit",
  "name": "synergy-frontend-kit",
  "verified": true,
  "official": true
}
```

`publish-market` does not automatically grant `official` or `verified`. Those are registry maintainer review labels. If the generated entry has them as `false`, set them to `true` only in the maintainer-owned official PR.

## 4. Manual Fallback

Use this path only when release upload, registry checkout, push, or PR creation cannot be automated.

Sign the package:

```bash
synergy-plugin sign synergy-frontend-kit-0.2.4.synergy-plugin.tgz
```

This creates:

```text
synergy-frontend-kit-0.2.4.synergy-plugin.tgz.sig
```

Create a release tagged `v0.2.4` in:

```text
https://github.com/EricSanchezok/synergy-frontend-kit
```

Upload both assets:

```text
synergy-frontend-kit-0.2.4.synergy-plugin.tgz
synergy-frontend-kit-0.2.4.synergy-plugin.tgz.sig
```

From a checkout of `SII-Holos/synergy-plugins` adjacent to this repository:

```bash
synergy-plugin entry synergy-frontend-kit-0.2.4.synergy-plugin.tgz \
  --repo https://github.com/EricSanchezok/synergy-frontend-kit \
  --verified \
  --official \
  --write-entry ../synergy-plugins/plugins/synergy-frontend-kit.json
```

Then validate the registry checkout:

```bash
cd ../synergy-plugins
bun install
bun run build-registry
bun run validate
bun run build-registry --check
```

Open a PR against `SII-Holos/synergy-plugins:main` with:

- `plugins/synergy-frontend-kit.json`
- regenerated `registry.json`
- release artifact links
- integrity, manifest hash, permissions hash, risk, runtime mode, tools, UI surfaces, and signer generated from the signed package

## 5. Registry Requirements

The official registry entry and package must satisfy:

- `plugin.id`, `plugin.json.name`, registry id, entry filename, approval id, and signature `pluginId` are all `synergy-frontend-kit`
- the tarball is an installable `.synergy-plugin.tgz`, not a source archive
- the release uploads include both the tarball and `<tarball>.sig`
- the registry entry contains `compatibility.synergy` matching `plugin.json` `engines.synergy`
- the registry version contains `downloadUrl`, `signatureUrl`, `signature.algorithm: "ed25519"`, `signature.signer`, `integrity`, `manifestHash`, `permissionsHash`, `risk`, `runtimeMode`, `permissionsSummary`, `tools`, `uiSurfaces`, and `publishedAt`
- the tarball contains `plugin.json`, `runtime/index.js`, `integrity.json`, `permissions.summary.json`, `ui/index.js`, and full `skills/`

## 6. Local Smoke Test

Before the registry PR merges, test the local registry UX:

```bash
synergy plugin publish synergy-frontend-kit-0.2.4.synergy-plugin.tgz
```

Also install directly from the tarball:

```bash
synergy plugin add file:///absolute/path/to/synergy-frontend-kit-0.2.4.synergy-plugin.tgz
```

After the registry PR merges, verify marketplace install:

```bash
synergy plugin search synergy-frontend-kit
synergy plugin add synergy-frontend-kit
```

Confirm:

- skills load
- `synergy synergy-frontend-kit setup --dry-run --json` works
- settings section renders
- MCP servers remain lazy until used
