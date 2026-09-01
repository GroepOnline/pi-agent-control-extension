#!/usr/bin/env bash
# Unit test: tctl --background + snapshot flow
# Tests the background launch health check, snapshot, cleanup, and edge cases.
set -euo pipefail

PASS=0
FAIL=0
SKIP=0
# Track created sessions for cleanup on interrupt
declare -a CREATED_SIDS=()

pass() { echo "  PASS: $1"; ((PASS++)) || true; }
fail() { echo "  FAIL: $1"; ((FAIL++)) || true; }
skip() { echo "  SKIP: $1"; ((SKIP++)) || true; }

TCTL="$(dirname "$0")/../bin/tctl"
REPO_ROOT="$(git -C "$(dirname "$TCTL")/.." rev-parse --show-toplevel 2>/dev/null || pwd)"

section() {
  echo ""
  echo "--- $1 ---"
}

# ---------------------------------------------------------------------------
# Signal/exit trap: clean up all sessions created during this test run
# ---------------------------------------------------------------------------
cleanup_test_sessions() {
  local sid
  for sid in "${CREATED_SIDS[@]:-}"; do
    "$TCTL" -s "$sid" close 2>/dev/null || true
  done
}
trap cleanup_test_sessions EXIT INT TERM

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
if ! command -v tuistory >/dev/null 2>&1; then
  echo "SKIP: tuistory not installed — cannot run tctl background tests"
  echo "Passed: $PASS  Failed: $FAIL  Skipped: $SKIP"
  exit 0
fi

# ---------------------------------------------------------------------------
# Test 1: Successful background launch → snapshot → close
# ---------------------------------------------------------------------------
section "1. Background launch → snapshot → close"
SID1="tctl-ut-bg-$(date +%s)"
CREATED_SIDS+=("$SID1")

# Use a long sleep so the session stays alive during snapshot
if "$TCTL" launch "echo hello-from-unit-test && sleep 10" \
    -s "$SID1" \
    --backend tuistory \
    --background \
    --repo-root "$REPO_ROOT" \
    --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1; then
  pass "background launch returned success"
else
  fail "background launch failed"
fi

# Snapshot should contain the echo output (tuistory preserves buffer)
sleep 1
if SNAP="$("$TCTL" -s "$SID1" snapshot 2>&1)" && echo "$SNAP" | grep -q "hello-from-unit-test"; then
  pass "snapshot contains expected output"
else
  echo "  snapshot output: $SNAP"
  fail "snapshot content mismatch"
fi

# Verify close cleans up the session directory
SESSION_DIR1="/tmp/tctl-sessions/$SID1"
"$TCTL" -s "$SID1" close 2>/dev/null || true
sleep 0.5
if [[ ! -d "$SESSION_DIR1" ]]; then
  pass "session directory cleaned up after close"
else
  fail "session directory still exists after close: $SESSION_DIR1"
  rm -rf "$SESSION_DIR1" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# Test 2: Health check returns quickly (within 8s budget)
# ---------------------------------------------------------------------------
section "2. Health check timing (launch returns in < 8s)"
SID2="tctl-ut-bg-timing-$(date +%s)"
CREATED_SIDS+=("$SID2")

START_NS=$(date +%s%N)
if "$TCTL" launch "sleep 10" \
    -s "$SID2" \
    --backend tuistory \
    --background \
    --repo-root "$REPO_ROOT" \
    --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1; then
  END_NS=$(date +%s%N)
  ELAPSED_MS=$(( (END_NS - START_NS) / 1000000 ))
  echo "  Launch completed in ${ELAPSED_MS}ms"
  # Native tuistory --background --no-wait should return well inside this generous budget.
  if (( ELAPSED_MS < 8000 )); then
    pass "health check completed within 8s budget (${ELAPSED_MS}ms)"
  else
    fail "health check took too long: ${ELAPSED_MS}ms (budget: 8000ms)"
  fi
  "$TCTL" -s "$SID2" close 2>/dev/null || true
else
  fail "timing test launch failed"
fi

# ---------------------------------------------------------------------------
# Test 3: Failed launch cleans up session directory
# ---------------------------------------------------------------------------
section "3. Failed launch cleanup"
SID3="tctl-ut-bg-fail-$(date +%s)"
CREATED_SIDS+=("$SID3")

# Keep the process alive briefly so the daemon can expose the failure state via snapshot
# before the short-lived command exits and the test performs cleanup.
OUTPUT="$("$TCTL" launch "sleep 0.1 && /nonexistent/binary/that/will/fail" \
    -s "$SID3" \
    --backend tuistory \
    --background \
    --repo-root "$REPO_ROOT" \
    --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1)" && RC=0 || RC=$?

SESSION_DIR3="/tmp/tctl-sessions/$SID3"

if [[ "$RC" -ne 0 ]]; then
  # Launch reported failure → verify cleanup
  if [[ ! -d "$SESSION_DIR3" ]] || [[ ! -f "$SESSION_DIR3/meta" ]]; then
    pass "failed launch cleaned up session directory"
  else
    fail "failed launch left meta file behind"
    rm -rf "$SESSION_DIR3" 2>/dev/null || true
  fi
else
  # Launch succeeded (tuistory registered before the runner exited)
  # Verify snapshot works, then clean up
  if "$TCTL" -s "$SID3" snapshot >/dev/null 2>&1; then
    pass "launch succeeded, snapshot works (tuistory registered before exit)"
  else
    fail "launch reported success but snapshot failed"
  fi
  "$TCTL" -s "$SID3" close 2>/dev/null || true
  sleep 0.5
  if [[ ! -d "$SESSION_DIR3" ]]; then
    pass "session directory cleaned up after close (failure case)"
  else
    rm -rf "$SESSION_DIR3" 2>/dev/null || true
  fi
fi

# ---------------------------------------------------------------------------
# Test 4: Multiple concurrent background sessions don't interfere
# ---------------------------------------------------------------------------
section "4. Concurrent background sessions"
SID4A="tctl-ut-bg-conc-a-$(date +%s)"
SID4B="tctl-ut-bg-conc-b-$(date +%s)"
CREATED_SIDS+=("$SID4A" "$SID4B")

LAUNCH_OK=true
"$TCTL" launch "echo session-a && sleep 10" -s "$SID4A" --backend tuistory --background --repo-root "$REPO_ROOT" --env FORCE_COLOR=3 2>&1 || LAUNCH_OK=false
"$TCTL" launch "echo session-b && sleep 10" -s "$SID4B" --backend tuistory --background --repo-root "$REPO_ROOT" --env FORCE_COLOR=3 2>&1 || LAUNCH_OK=false

if $LAUNCH_OK; then
  pass "both concurrent background sessions launched"
else
  fail "one or both concurrent background sessions failed to launch"
fi

# Verify each session has distinct output
sleep 1
SNAP4A="$("$TCTL" -s "$SID4A" snapshot 2>&1 || echo "SNAPSHOT_FAILED")"
SNAP4B="$("$TCTL" -s "$SID4B" snapshot 2>&1 || echo "SNAPSHOT_FAILED")"

if echo "$SNAP4A" | grep -q "session-a" && echo "$SNAP4B" | grep -q "session-b"; then
  pass "concurrent sessions have distinct output"
else
  echo "  Session A: $(echo "$SNAP4A" | head -3)"
  echo "  Session B: $(echo "$SNAP4B" | head -3)"
  fail "concurrent sessions output mismatch"
fi

# Verify session directories are separate
DIR4A="/tmp/tctl-sessions/$SID4A"
DIR4B="/tmp/tctl-sessions/$SID4B"
if [[ -d "$DIR4A" && -d "$DIR4B" ]]; then
  pass "concurrent sessions have separate directories"
else
  fail "concurrent session directories missing"
fi

# Cleanup
"$TCTL" -s "$SID4A" close 2>/dev/null || true
"$TCTL" -s "$SID4B" close 2>/dev/null || true

# ---------------------------------------------------------------------------
# Test 5: Regression guard — snapshot works after background launch
# (covers the original tuistory bypass bug)
# ---------------------------------------------------------------------------
section "5. Regression: snapshot after background launch uses tuistory"
SID5="tctl-ut-bg-regression-$(date +%s)"
CREATED_SIDS+=("$SID5")

if "$TCTL" launch "echo regression-test-passed && sleep 5" \
    -s "$SID5" \
    --backend tuistory \
    --background \
    --repo-root "$REPO_ROOT" \
    --env FORCE_COLOR=3 --env COLORTERM=truecolor 2>&1; then
  pass "regression launch succeeded"
else
  fail "regression launch failed"
fi

sleep 1
# This is the critical regression check: if tuistory bypass bug reoccurs,
# snapshot will fail with "session not found"
if SNAP5="$("$TCTL" -s "$SID5" snapshot 2>&1)"; then
  if echo "$SNAP5" | grep -q "regression-test-passed"; then
    pass "regression snapshot matches (tuistory tracking works)"
  elif echo "$SNAP5" | grep -q "session not found"; then
    fail "REGRESSION: tuistory bypass bug — session not found"
  else
    echo "  snapshot output: $(echo "$SNAP5" | head -3)"
    fail "regression snapshot unexpected output"
  fi
else
  echo "  snapshot error: $SNAP5"
  fail "REGRESSION: snapshot command failed"
fi

"$TCTL" -s "$SID5" close 2>/dev/null || true

# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------
echo ""
echo "=== tctl --background Unit Test Results ==="
echo "Passed: $PASS  Failed: $FAIL  Skipped: $SKIP"

if [[ $FAIL -gt 0 ]]; then
  echo "Tests completed with failures."
  exit 1
fi

echo "All tctl --background unit tests passed!"
