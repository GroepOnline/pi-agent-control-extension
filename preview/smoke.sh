#!/bin/sh
# Smoke-test the installed preview package: the exact entries pi loads plus
# the bundled CLI scripts must be present and syntactically valid.
set -eu
PREFIX="${1:-./pkg}"
PKG="$PREFIX/node_modules/@groeponline/pi-agent-control-extension"
fail() { echo "preview FAIL: $1" >&2; exit 1; }
test -f "$PKG/packages/extension/index.ts" || fail "missing pi extension entry packages/extension/index.ts"
test -d "$PKG/packages/skills" || fail "missing pi skills dir packages/skills"
for bin in tctl skill-studio control-narrate; do
  test -f "$PKG/bin/$bin" || fail "missing bin/$bin"
  bash -n "$PKG/bin/$bin" || fail "bin/$bin syntax check failed"
done
echo "preview OK: @groeponline/pi-agent-control-extension (extension + skills + bins present)"
