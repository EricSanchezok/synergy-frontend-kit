#!/usr/bin/env bash
# Maintainer tool: one-command sync for bundled skill assets.
# Reads skills.sources.json, syncs upstream bundles, refreshes descriptors,
# and verifies that bundled markdown links/resources are complete.
#
# Usage:
#   bash scripts/update.sh --dry-run
#   bash scripts/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN=false
QUIET=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --quiet) QUIET=true ;;
  esac
done

SYNC_ARGS=()
if $DRY_RUN; then
  SYNC_ARGS+=(--dry-run)
fi
if $QUIET; then
  SYNC_ARGS+=(--quiet)
fi

if ! $QUIET; then
  echo "Syncing skill bundles from skills.sources.json..."
fi
if [ ${#SYNC_ARGS[@]} -gt 0 ]; then
  bun run "$SCRIPT_DIR/sync-skills.ts" "${SYNC_ARGS[@]}"
else
  bun run "$SCRIPT_DIR/sync-skills.ts"
fi

if $DRY_RUN; then
  if ! $QUIET; then
    echo ""
    echo "Skipping descriptor rewrite and verification because this is a dry run."
  fi
  exit 0
fi

if ! $QUIET; then
  echo ""
  echo "Syncing skill descriptions to the API3 definition..."
fi
bun run "$SCRIPT_DIR/sync-descriptions.ts"

if ! $QUIET; then
  echo ""
  echo "Verifying bundled skill assets..."
fi
bun run "$SCRIPT_DIR/verify-skill-bundles.ts"
