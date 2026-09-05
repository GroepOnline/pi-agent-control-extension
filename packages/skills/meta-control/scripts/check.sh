#!/usr/bin/env bash
# meta-control sidecar: validate that this skill is wired up and prepare a run dir.
# Exits 0 with JSON summary on success, non-zero when something needs fixing.
#
# Usage:
#   ./scripts/check.sh                # doctor only
#   ./scripts/check.sh --new-run      # doctor + create timestamped RUN_DIR
#   ./scripts/check.sh --json         # force JSON (default)
#   ./scripts/check.sh --quiet        # only print final one-line summary
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
ACTION="doctor"
QUIET=0

for arg in "$@"; do
  case "$arg" in
    --new-run) ACTION="new-run" ;;
    --json) ;; # default
    --quiet) QUIET=1 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

log() { [ "$QUIET" -eq 1 ] || echo "$@" >&2; }

# 1. Verify the skill's SKILL.md is parseable and has the required frontmatter.
SKILL_MD="$SKILL_DIR/SKILL.md"
MISSING=()
[ -f "$SKILL_MD" ] || MISSING+=("SKILL.md missing")

if [ -f "$SKILL_MD" ]; then
  HAS_NAME=$(head -20 "$SKILL_MD" | grep -c '^name:')
  HAS_DESC=$(head -20 "$SKILL_MD" | grep -c '^description:')
  [ "$HAS_NAME" -ge 1 ] || MISSING+=("frontmatter: name")
  [ "$HAS_DESC" -ge 1 ] || MISSING+=("frontmatter: description")
fi

# 2. Verify referenced assets (subagents/) exist if the SKILL.md mentions them.
SUBAGENTS_DIR="$SKILL_DIR/subagents"
if grep -q 'subagents/' "$SKILL_MD" 2>/dev/null; then
  [ -d "$SUBAGENTS_DIR" ] || MISSING+=("subagents/ directory referenced in SKILL.md but not present")
fi

# 3. Optional: run the package validator when Python is available, preserving failure.
VALIDATOR_OUT=""
if command -v python3 >/dev/null 2>&1 && [ -f "$REPO_ROOT/scripts/validate-package.py" ]; then
  VALIDATOR_RAW=$(python3 "$REPO_ROOT/scripts/validate-package.py" 2>&1)
  VALIDATOR_STATUS=$?
  VALIDATOR_OUT=$(printf '%s\n' "$VALIDATOR_RAW" | tail -n 20)
  [ "$VALIDATOR_STATUS" -eq 0 ] || MISSING+=("package validator failed (exit $VALIDATOR_STATUS)")
fi

# 4. Optional: create a timestamped RUN_DIR with evidence subfolder when --new-run.
RUN_DIR=""
RUN_ID=""
if [ "$ACTION" = "new-run" ]; then
  TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
  BASE_RUN_ID="run-${TS}"
  ATTEMPT=0
  while :; do
    RUN_ID="$BASE_RUN_ID"
    [ "$ATTEMPT" -eq 0 ] || RUN_ID="${BASE_RUN_ID}-${ATTEMPT}"
    RUN_DIR="$REPO_ROOT/artifacts/runs/$RUN_ID"
    if mkdir "$RUN_DIR" 2>/dev/null; then break; fi
    ATTEMPT=$((ATTEMPT + 1))
    [ "$ATTEMPT" -lt 100 ] || { echo "Unable to allocate unique run directory" >&2; exit 1; }
  done
  mkdir "$RUN_DIR/evidence"
fi

OK=1
[ ${#MISSING[@]} -eq 0 ] || OK=0

# Emit JSON.
TS_NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MISSING_JSON="[]"
if [ ${#MISSING[@]} -gt 0 ]; then
  MISSING_JSON=$(printf '"%s",' "${MISSING[@]}" | sed 's/,$//' | awk '{print "["$0"]"}')
fi
if command -v python3 >/dev/null 2>&1; then
  VALIDATOR_JSON=$(printf '%s' "$VALIDATOR_OUT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
elif command -v node >/dev/null 2>&1; then
  VALIDATOR_JSON=$(printf '%s' "$VALIDATOR_OUT" | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.stringify(s)))')
else
  echo "Neither python3 nor node is available for JSON serialization" >&2
  exit 1
fi
cat <<EOF
{"ok":$OK,"skill_dir":"$SKILL_DIR","repo_root":"$REPO_ROOT","checked_at":"$TS_NOW","missing":$MISSING_JSON,"validator_tail":$VALIDATOR_JSON,"run_id":"$RUN_ID","run_dir":"$RUN_DIR","action":"$ACTION"}
EOF

log ""
if [ "$OK" -eq 1 ]; then
  log "✅ meta-control check passed"
  [ -n "$RUN_DIR" ] && log "📁 $RUN_DIR"
else
  log "❌ meta-control check failed:"
  for m in "${MISSING[@]}"; do log "  - $m"; done
fi

exit $((1 - OK))
