# Testing & Evidence

## Local checks

| Check | Command | What it gates |
|---|---|---|
| Type check | `tsc --noEmit` | extension + studio types |
| Unit / component tests | `npm test` (vitest) | all `packages/extension/**/*.test.{ts,tsx}` — routing, guards, recipes, capture, bridge, schema, cli, studio hooks/panes |
| Benchmarks | `npx vitest bench` | `routing.bench.ts`, `guards.bench.ts` regression probes |
| Package validator | `/doctor-control`, `control_doctor`, or `python3 scripts/validate-package.py` | required files + exact `EXPECTED_SKILLS` set + package metadata |
| E2E | `npm run test:e2e` | terminal/browser loop smoke tests |
| Lint (Python) | `ruff check . && ruff format --check .` | validator + scripts hygiene |

Current baseline: 32 test files / 496 tests green; `tsc --noEmit` clean.

## Evidence schema (the contract)

Every control run produces a run directory `artifacts/runs/<timestamp>-<slug>/`:

```
artifacts/runs/<slug>/
├── run.json            # task, target, driver, dimensions, branch/worktree, timestamps
├── transcript.md       # human-readable action log
├── evidence/           # snapshots, screenshots (png), casts, mp4s, logs
└── verification.md     # commitments checked against visible evidence
```

Minimum proof item (`EVIDENCE_SCHEMA` in `packages/extension/schema.ts`):

```json
{
  "claim": "ESC cancels streaming in bash mode",
  "step": "press ESC during active stream",
  "driver": "tuistory or true-input",
  "evidence": ["snapshot-before.txt", "snapshot-after.txt"],
  "result": "pass | fail",
  "reason": "observable state changed / did not change"
}
```

`/evidence-new` scaffolds a fresh run dir.

## Verify workflow

1. **Capture** with the routed driver into `evidence/`.
2. **Commit** each claim against its artifact (claim → step → evidence files → result → reason).
3. **Verify structurally** — `control_verify_commitments` checks for: technical section, commitments section, evidence mention, and a pass/fail signal. Missing parts are reported by name (`Missing: evidence, commitments`).
4. **Parallel QA** — `control_parallel_verify` runs that structural check over many named reports in one pass and returns a PASS/FAIL table with per-report missing sections.
5. **Ship the video only after evidence** — showcase/compose come last; `ffprobe` must confirm duration/resolution (recipe `showcase-compose`).

## Guardrail tests

- `guards.test.ts` covers the destructive-command and `.env` blocklists; `guards.bench.ts` keeps the hot path fast (the guard runs on **every** shell-shaped tool call via `pi.on("tool_call")`).
- `routing.test.ts` covers keyword matching, negative keywords, rule priority, and duplicate-skill collapse.
- `skill-merge.test.ts` covers the 3-way merge, conflict markers, and merge-state persistence.
- `browser_command.test.ts` / `shell_command.test.ts` / `os.test.ts` cover the OS/browser/shell tool allowlists and path restrictions.

## CI

Workflows run on self-hosted runners (org billing quarantine): Analyze (javascript-typescript), build, sync, plus external CodeRabbit and Socket Security checks. Merge gate = required checks green on the head SHA.