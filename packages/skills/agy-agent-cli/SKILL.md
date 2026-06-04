---
name: agy-agent-cli
description: Antigravity Agent CLI target atom for launch, print mode, slash commands, prompt templates, package skills, sessions, file mentions, and reproducible capture via tctl.
---

# Antigravity Agent CLI Target Atom

The `agy-agent-control` orchestrator routed you here. Use this atom whenever the target under test is Antigravity Agent CLI itself or a workflow driven through `agy`.

## Launch principles

- Launch from the target repository root so `AGENTS.md`, `.agents/skills`, `.agy/skills`, skills/, prompts/, `.agy/prompts`, package metadata, git metadata, and relative paths resolve correctly.
- Use `tctl` for any recorded session. Do not call `tuistory launch` directly.
- Use identical terminal dimensions, env vars, prompt text, and repo state for before/after comparisons.

```bash
TCTL=${AGY_AGENT_CONTROL_ROOT}/bin/tctl
$TCTL launch "agy" -s ${RUN_ID}-agy --backend tuistory \
  --repo-root /path/to/worktree \
  --cols 120 --rows 36 --record ${RUN_DIR}/agy.cast \
  --env FORCE_COLOR=3 --env COLORTERM=truecolor
```

## Print mode capture

Use print mode when the proof is non-interactive:

```bash
$TCTL launch "agy -p 'inspect the repo, run relevant checks, summarize evidence'" \
  -s ${RUN_ID}-agy-print --backend tuistory \
  --repo-root /path/to/worktree \
  --cols 120 --rows 36 --record ${RUN_DIR}/agy-print.cast \
  --env FORCE_COLOR=3 --env COLORTERM=truecolor
```

## Agy-specific checks

| Need | Preferred proof |
|---|---|
| Package skill discovery | Show `/skill:` suggestions or list loaded skill names |
| Prompt templates | Invoke `/demo`, `/verify`, or `/qa-test` from `prompts/` |
| File mention flow | Type `@`, select a file, and capture selected path/context |
| Shell context | Use `!<command>` when command output should enter context |
| Shell-only command | Use `!!<command>` when output should not enter context |
| Sessions | Capture `--continue`, `/tree`, `/fork`, `/clone`, or CLI resume output if relevant |

If key bindings differ by installed Antigravity version, discover them with `agy help`, `/settings`, or `agy --help` before recording.

## Prompt-template proof

```bash
$TCTL -s ${RUN_ID}-agy type "/verify ESC cancels streaming in bash mode"
$TCTL -s ${RUN_ID}-agy press enter
$TCTL -s ${RUN_ID}-agy wait-idle --timeout 30000
$TCTL -s ${RUN_ID}-agy snapshot --trim
```

## Provenance checklist

```bash
agy --version || true
pwd
git rev-parse --abbrev-ref HEAD || true
git rev-parse HEAD || true
find .agents/skills .agy/skills skills prompts .agy/prompts -maxdepth 2 -type f 2>/dev/null | sort
```
