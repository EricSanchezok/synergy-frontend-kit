#!/usr/bin/env bash
# Maintainer tool — syncs bundled SKILL.md files with upstream source repositories.
# Not exposed to end users. Run this locally, then commit and release a new version.
# Usage: bash scripts/update.sh [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$SCRIPT_DIR/../skills"
TEMP_DIR="$(mktemp -d)"
DRY_RUN=false
QUIET=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --quiet) QUIET=true ;;
  esac
done

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Map of destination skill name → "repo_url::source_path_in_repo"
declare -A SOURCES=(
  ["frontend-design"]="https://github.com/anthropics/skills.git::skills/frontend-design/SKILL.md"
  ["taste-frontend"]="https://github.com/Leonxlnx/taste-skill.git::skills/taste-skill/SKILL.md"
  ["soft-design"]="https://github.com/Leonxlnx/taste-skill.git::skills/soft-skill/SKILL.md"
  ["minimalist-design"]="https://github.com/Leonxlnx/taste-skill.git::skills/minimalist-skill/SKILL.md"
)

updated_count=0
unchanged_count=0
failed_count=0

for skill in "${!SOURCES[@]}"; do
  IFS="::" read -r repo filepath <<< "${SOURCES[$skill]}"
  repo_name=$(basename "$repo" .git)
  repo_dir="$TEMP_DIR/$repo_name"

  $QUIET || echo "→ $skill ($repo_name)"

  if [[ -d "$repo_dir" ]]; then
    git -C "$repo_dir" pull --ff-only --depth 1 2>/dev/null || true
  else
    git clone --depth 1 --quiet "$repo" "$repo_dir" 2>/dev/null || {
      echo "  ✘ Failed to clone $repo"
      ((failed_count++))
      continue
    }
  fi

  src="$repo_dir/$filepath"
  dest="$SKILLS_DIR/$skill/SKILL.md"

  if [[ ! -f "$src" ]]; then
    echo "  ✘ Source not found: $filepath"
    echo "     Expected at: $src"
    ((failed_count++))
    continue
  fi

  if $DRY_RUN; then
    if diff -q "$dest" "$src" &>/dev/null; then
      $QUIET || echo "  (no changes)"
      ((unchanged_count++))
    else
      echo "  (would update)"
      diff --unified=2 "$dest" "$src" || true
      ((updated_count++))
    fi
  else
    if diff -q "$dest" "$src" &>/dev/null; then
      $QUIET || echo "  (already up to date)"
      ((unchanged_count++))
    else
      cp "$src" "$dest"
      echo "  ✓ Updated"
      ((updated_count++))
    fi
  fi
done

echo ""
if $DRY_RUN; then
  echo "Summary (dry run): $updated_count would update, $unchanged_count unchanged, $failed_count failed"
  echo "Run without --dry-run to apply updates."
else
  echo "Summary: $updated_count updated, $unchanged_count unchanged, $failed_count failed"
  if [[ $updated_count -gt 0 ]]; then
    echo "Skills updated. Commit the changes and release a new version."
    echo "Users upgrade via: synergy plugin update frontend-kit"
  fi
fi

if [[ $failed_count -gt 0 ]]; then
  exit 1
fi
