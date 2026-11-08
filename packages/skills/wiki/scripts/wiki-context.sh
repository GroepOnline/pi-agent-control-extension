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
EXPLICIT_REPO=0
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) REPO_SLUG="$arg"; EXPLICIT_REPO=1 ;;
  esac
done

log() { [ "$QUIET" -eq 1 ] || echo "$@" >&2; }

# Resolve owner/repo from explicit arg or git remote.
# Always record the local checkout's remote separately: local_docs[] describe
# this checkout, which may differ from the requested repo.
REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
# Handles https://github.com/Owner/Repo(.git) and git@github.com:Owner/Repo(.git)
CHECKOUT_REPO=$(printf '%s' "$REMOTE_URL" \
  | sed -E 's#^https?://[^/]+/##; s#^git@[^:]+:##; s#\.git$##')
if [ -z "$REPO_SLUG" ]; then
  REPO_SLUG="$CHECKOUT_REPO"
fi

if [ "$EXPLICIT_REPO" -eq 1 ] && [[ "$REPO_SLUG" != */* ]]; then
  echo "wiki-context: invalid repository '$REPO_SLUG' (expected owner/repo)" >&2
  exit 2
fi

if [ -z "$REPO_SLUG" ] || [[ "$REPO_SLUG" != */* ]]; then
  # No remote and no explicit slug: still inventory the local docs (they are
  # the useful half of this sidecar) and report a null DeepWiki target.
  REPO_JSON="null"
  DEEPWIKI_JSON="null"
  log "⚠️  no owner/repo resolvable; reporting local docs only"
else
  REPO_JSON="\"$REPO_SLUG\""
  DEEPWIKI_URL="https://deepwiki.com/${REPO_SLUG}"
  DEEPWIKI_JSON="\"$DEEPWIKI_URL\""
fi
CHECKOUT_JSON="null"
[ -n "$CHECKOUT_REPO" ] && [[ "$CHECKOUT_REPO" == */* ]] && CHECKOUT_JSON="\"$CHECKOUT_REPO\""


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
DOCS_JSON=""
for doc in "${DOCS[@]:-}"; do
  [ -n "$doc" ] || continue
  DOCS_JSON="${DOCS_JSON}\"${doc}\","
done
DOCS_JSON="${DOCS_JSON%,}"
cat <<EOF
{"ok":1,"repo":${REPO_JSON},"deepwiki_url":${DEEPWIKI_JSON},"checkout_repo":${CHECKOUT_JSON},"checked_at":"$TS_NOW","local_docs":[${DOCS_JSON}],"skill_count":${SKILL_COUNT:-0}}
EOF

log ""
[ "$REPO_JSON" = "null" ] || log "📖 DeepWiki: $DEEPWIKI_URL"
log "📁 ${#DOCS[@]} local doc(s), $SKILL_COUNT skill(s) in checkout ${CHECKOUT_REPO:-<none>}"
