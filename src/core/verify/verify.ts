export function recipeFor(kind: string): string {
  switch (kind) {
    case "tuistory-launch":
      return `TCTL=./bin/tctl
RUN_ID=$(date +%Y%m%d-%H%M%S)-demo
RUN_DIR=artifacts/runs/$RUN_ID
mkdir -p "$RUN_DIR"
$TCTL launch "pi" -s "$RUN_ID" --backend tuistory \
  --repo-root /path/to/worktree \
  --cols 120 --rows 36 \
  --record "$RUN_DIR/demo.cast" \
  --env FORCE_COLOR=3 --env COLORTERM=truecolor
$TCTL -s "$RUN_ID" wait-idle --timeout 15000
$TCTL -s "$RUN_ID" snapshot --trim | tee "$RUN_DIR/evidence/initial-snapshot.txt"`;
    case "browser-loop":
      return `agent-browser open https://example.com --viewport 1280x720
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser click @e1
agent-browser snapshot -i
agent-browser close`;
    case "showcase-compose":
      return `npm --prefix remotion install
./scripts/render-showcase.sh --props artifacts/runs/<run>/showcase-props.json --out artifacts/runs/<run>/showcase.mp4
ffprobe -v quiet -print_format json -show_format -show_streams artifacts/runs/<run>/showcase.mp4`;
    case "qa-report":
      return `# QA Report

| Step | Expected | Observed | Result | Evidence |
|---|---|---|---|---|
| 1 |  |  | PASS/FAIL | evidence/... |

## Conclusion
State whether the claim is supported by evidence.`;
    default:
      return `Known recipes: tuistory-launch, browser-loop, showcase-compose, qa-report`;
  }
}

export interface VerifyCommitmentResult {
  ok: boolean;
  checks: { name: string; ok: boolean }[];
  failed: string[];
}

export function verifyCommitments(markdown: string): VerifyCommitmentResult {
  const checks = [
    ["has technical section", /technical/i.test(markdown)],
    ["has commitments section", /commitments/i.test(markdown)],
    ["mentions evidence", /evidence|snapshot|screenshot|cast|mp4/i.test(markdown)],
    ["has pass/fail signal", /pass|fail|✓|✗|\[x\]|\[ \]/i.test(markdown)],
  ] as const;
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    ok: failed.length === 0,
    checks: checks.map(([name, ok]) => ({ name, ok })),
    failed,
  };
}

export interface VerifyTaskResult {
  ok: boolean;
  message: string;
  checks: { name: string; ok: boolean }[];
}

export function verifyTask(markdownContent: string): VerifyTaskResult {
  const checkResult = verifyCommitments(markdownContent);
  if (checkResult.ok) {
    return {
      ok: true,
      message: "All commitments and evidence verifications passed.",
      checks: checkResult.checks,
    };
  } else {
    return {
      ok: false,
      message: `Verification failed on: ${checkResult.failed.join(", ")}`,
      checks: checkResult.checks,
    };
  }
}
