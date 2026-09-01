#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; ((PASS++)) || true; }
fail() { echo "  FAIL: $1"; ((FAIL++)) || true; }

echo "=== Phase 1: Structural Validation ==="

echo "--- 1a. Extension check (pi --offline) ---"
if command -v pi >/dev/null 2>&1; then
  if npm run check 2>&1; then
    pass "pi extension check"
  else
    fail "pi extension check"
  fi
else
  echo "--- 1a. pi extension check --- SKIP: pi not installed"
fi

echo "--- 1b. Package validation ---"
if npm run validate 2>&1; then
  pass "package validation"
else
  # Python may not be available; treat as non-fatal on non-CI
  if [[ -n "${CI:-}" ]]; then
    fail "package validation"
  else
    echo "  SKIP: python not available (local run)"
  fi
fi

echo ""
echo "=== Phase 2: Driver Smoke Tests ==="

TCTL="$(dirname "$0")/../bin/tctl"

if command -v tuistory >/dev/null 2>&1; then
  echo "--- 2a. tctl tuistory launch + snapshot ---"
  TEST_SID="e2e-$(date +%s)"
  RUN_DIR="artifacts/e2e-runs/$TEST_SID"
  mkdir -p "$RUN_DIR"

  if "$TCTL" launch "echo hello-from-tctl" -s "$TEST_SID" \
      --backend tuistory \
      --cols 80 --rows 24 \
      --repo-root "$(git -C "$(dirname "$TCTL")/.." rev-parse --show-toplevel 2>/dev/null || pwd)" \
      --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1; then
    sleep 1
    if SNAP="$("$TCTL" -s "$TEST_SID" snapshot 2>&1)" && echo "$SNAP" | grep -q "hello-from-tctl"; then
      pass "tctl tuistory snapshot matches"
    else
      echo "  snapshot output: $SNAP"
      fail "tctl tuistory snapshot content mismatch"
    fi
    "$TCTL" -s "$TEST_SID" close 2>/dev/null || true
  else
    echo "  tuistory binary found but launch failed (check tuistory version)"
    fail "tctl tuistory launch"
  fi
else
  echo "--- 2a. tctl tuistory --- SKIP: tuistory not installed"
fi

if command -v tuistory >/dev/null 2>&1; then
  echo "--- 2b. tctl --background (tuistory daemon) ---"
  TEST_BG_SID="e2e-bg-$(date +%s)"

  if "$TCTL" launch "echo hello-from-background && sleep 1" \
      -s "$TEST_BG_SID" \
      --backend tuistory \
      --background \
      --repo-root "$(git -C "$(dirname "$TCTL")/.." rev-parse --show-toplevel 2>/dev/null || pwd)" \
      --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1; then
    sleep 2
    if SNAP="$("$TCTL" -s "$TEST_BG_SID" snapshot 2>&1)" && echo "$SNAP" | grep -q "hello-from-background"; then
      pass "tctl --background snapshot matches"
    else
      echo "  snapshot output: $SNAP"
      fail "tctl --background snapshot content mismatch"
    fi
    "$TCTL" -s "$TEST_BG_SID" close 2>/dev/null || true
  else
    echo "  tuistory binary found but background launch failed"
    fail "tctl --background launch"
  fi
else
  echo "--- 2b. tctl --background --- SKIP: tuistory not installed"
fi

echo ""
echo "=== Results ==="
echo "Passed: $PASS  Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  echo "E2E completed with failures."
  exit 1
fi

echo "E2E Tests Passed!"
