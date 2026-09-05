#!/usr/bin/env bash
# wiki sidecar: resolve the DeepWiki URL for a repo and inventory local docs.
# No network calls — the agent fetches DeepWiki itself. Exits 0 with JSON.
#
# Usage:
#   ./scripts/wiki-context.sh                # current repo (git remote)
#   ./scripts/wiki-context.sh <owner/repo>   # explicit repo
#   ./scripts/wiki-context.sh --quiet        # JSON only
set -uo pipefail

QUIET=0
REPO_SLUG=""
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) REPO_SLUG="$arg" ;;
  esac
done

log() { [ "$QUIET" -eq 1 ] || echo "$@" >&2; }

# Resolve owner/repo from explicit arg or git remote.
if [ -z "$REPO_SLUG" ]; then
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
  # Handles https://github.com/Owner/Repo(.git) and git@github.com:Owner/Repo(.git)
  REPO_SLUG=$(printf '%s' "$REMOTE_URL" \
    | sed -E 's#^https?://[^/]+/##; s#^git@[^:]+:##; s#\.git$##')
fi

if [ -z "$REPO_SLUG" ] || [[ "$REPO_SLUG" != */* ]]; then
  echo '{"ok":0,"error":"could not resolve owner/repo (no git remote?)"}'
  log "❌ no owner/repo resolvable; pass <owner/repo> explicitly"
  exit 1
fi

DEEPWIKI_URL="https://deepwiki.com/${REPO_SLUG}"

# Inventory local docs relative to repo root.
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DOCS=()
[ -f "$GIT_ROOT/README.md" ] && DOCS+=("README.md")
[ -f "$GIT_ROOT/ARCHITECTURE.md" ] && DOCS+=("ARCHITECTURE.md")
[ -f "$GIT_ROOT/CLAUDE.md" ] && DOCS+=("CLAUDE.md")
[ -f "$GIT_ROOT/AGENTS.md" ] && DOCS+=("AGENTS.md")
[ -d "$GIT_ROOT/docs" ] && while IFS= read -r f; do
  DOCS+=("docs/${f#$GIT_ROOT/docs/}")
done < <(find "$GIT_ROOT/docs" -name '*.md' -not -path '*/node_modules/*' | head -20)
SKILL_COUNT=$(find "$GIT_ROOT/packages/skills" -maxdepth 2 -name 'SKILL.md' 2>/dev/null | wc -l | tr -d ' ')

TS_NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DOCS_JSON=$(printf '"%s",' "${DOCS[@]:-}" | sed 's/,$//')
cat <<EOF
{"ok":1,"repo":"$REPO_SLUG","deepwiki_url":"$DEEPWIKI_URL","checked_at":"$TS_NOW","local_docs":[${DOCS_JSON}],"skill_count":${SKILL_COUNT:-0}}
EOF

log ""
log "📖 DeepWiki: $DEEPWIKI_URL"
log "📁 ${#DOCS[@]} local doc(s), $SKILL_COUNT skill(s)"
