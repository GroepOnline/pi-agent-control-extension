#!/usr/bin/env bash
# Auto-update AGENTS.md test count from vitest results
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTS="$PROJECT_ROOT/AGENTS.md"

# Run vitest and capture JSON output
OUTPUT=$(cd "$PROJECT_ROOT" && npx vitest run --reporter=json 2>/dev/null | tail -1)

# Extract test count
COUNT=$(echo "$OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['numPassedTests'])" 2>/dev/null || echo "")

if [ -z "$COUNT" ]; then
  echo "update-test-count: could not parse test count" >&2
  exit 1
fi

# Update AGENTS.md
sed -i "s/Run all [0-9]* tests/Run all $COUNT tests/" "$AGENTS"
echo "update-test-count: AGENTS.md updated to $COUNT tests"