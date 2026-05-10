---
name: autoresearch
description: Autonomous experiment loop for optimization research. Use when optimizing a measurable metric through systematic experimentation (ML training loss, test speed, bundle size, build time, etc.), or when running automated research loops: try an idea, measure it, keep improvements, revert regressions, repeat. Implements MAD-based confidence scoring, git branch isolation, and structured experiment logging.
---
# Autoresearch

Autonomous experiment loop: try ideas, keep what works, discard what doesn't, never stop.

## Overview

Systematically improve a measurable metric by making changes, running experiments, and keeping only the improvements. Structured state files allow any session — including a fresh one with no memory — to resume exactly where you left off.

## Setup

### Step 1: Gather information

Ask the user (or infer):
- **Goal**: What to optimize (e.g., "minimize val_bpb", "reduce test runtime", "shrink bundle size")
- **Command**: What to run (e.g., `uv run train.py`, `pnpm test`)
- **Primary metric**: Name, unit, direction (lower/higher is better)
- **Files in scope**: Which files may be modified
- **Constraints**: Hard rules (tests must pass, no new deps, etc.)
- **Termination**: When to stop — fixed experiment count, time budget, target metric, or until interrupted (default)

### Step 2: Create branch and state files

```bash
git checkout autoresearch/<goal>-<date> 2>/dev/null || git checkout -b autoresearch/<goal>-<date>
```

Read source files thoroughly. Understand the workload deeply before writing.

#### `autoresearch.md` — living research document

```markdown
# Autoresearch: <goal>

## Objective
<Specific description>

## Metrics
- **Primary**: <name> (<unit>, lower/higher is better)
- **Secondary**: <name>, ...

## How to Run
`./autoresearch.sh` — outputs `METRIC name=number` lines.

## Files in Scope
<Every file the agent may modify, with brief notes>

## Off Limits
<What must NOT be touched>

## Constraints
<Hard rules>

## Termination
<When to stop>

## What's Been Tried
<Update as experiments accumulate>
```

#### `autoresearch.sh` — benchmark script

```bash
#!/bin/bash
set -euo pipefail

# Pre-check: syntax validation
python3 -c "import ast; ast.parse(open('train.py').read())" 2>&1 || { echo "SYNTAX ERROR"; exit 1; }

# Run workload
output=$(uv run train.py 2>&1)

# Extract metrics
val_bpb=$(echo "$output" | grep -oP 'val_bpb=\K[0-9.]+' | tail -1)
echo "METRIC val_bpb=$val_bpb"
```

#### `autoresearch.checks.sh` (optional)

Only create when constraints require correctness validation. Bash script for backpressure checks (tests, types, lint).

### Step 3: Initialize JSONL

```bash
python3 autoresearch_helper.py init --jsonl autoresearch.jsonl --name '<goal>' --metric-name '<metric_name>' --direction <lower|higher>
git add autoresearch.md autoresearch.sh autoresearch.jsonl
git commit -m "autoresearch: initialize experiment session"
```

### Step 4: Run baseline

```bash
bash autoresearch.sh
```

Parse METRIC lines, log as keep:

```bash
python3 autoresearch_helper.py log --jsonl autoresearch.jsonl \
  --commit $(git rev-parse --short=7 HEAD) \
  --metric <baseline_value> \
  --status keep \
  --description "baseline" \
  --asi '{"hypothesis": "baseline measurement"}' \
  --direction <lower|higher>
```

## The experiment loop

**LOOP FOREVER.** Never ask "should I continue?" Only stop when termination condition met, user interrupts, or low on context.

### Per experiment:

#### 1. Choose
Read `autoresearch.md` ("What's Been Tried") and `autoresearch.ideas.md` (if exists). Think deeply — best ideas come from understanding, not random variation.

#### 2. Change
Edit files in scope. One hypothesis per experiment.

#### 3. Run
```bash
timeout 600 bash autoresearch.sh
```
Parse `METRIC name=value` lines. If crash/timeout → log as crash and revert. If checks fail → log as `checks_failed` and revert.

#### 4. Evaluate
```bash
python3 autoresearch_helper.py evaluate --jsonl autoresearch.jsonl --metric <value> --direction <lower|higher>
```

Rules:
- Primary metric improved → `keep`
- Worse or unchanged → `discard`
- Simpler code, equal perf → `keep`
- Ugly complexity for tiny gain → probably `discard`

#### 5. Record

**On keep:** log to JSONL then commit all changes.
```bash
python3 autoresearch_helper.py log --jsonl autoresearch.jsonl \
  --commit $(git rev-parse --short=7 HEAD) \
  --metric <value> --status keep \
  --description "<what was tried>" \
  --asi '{"hypothesis": "<what you tried>"}' \
  --direction <lower|higher>
git add -A
git commit -m "<description>"
```

**On discard/crash:** log to JSONL, then revert (backing up state files):
```bash
python3 autoresearch_helper.py log --jsonl autoresearch.jsonl \
  --commit "0000000" --metric <value> \
  --status <discard|crash|checks_failed> \
  --description "<what was tried>" \
  --asi '{"hypothesis": "...", "rollback_reason": "..."}' \
  --direction <lower|higher>

cp autoresearch.jsonl autoresearch.jsonl.bak
cp autoresearch.md autoresearch.md.bak
git checkout -- .
git clean -fd
cp autoresearch.jsonl.bak autoresearch.jsonl
cp autoresearch.md.bak autoresearch.md
rm -f *.bak
```

#### 6. Update journal
Update "What's Been Tried" section every few experiments. Include wins, dead ends, current best.

#### 7. Maintain ideas backlog
Append promising ideas to `autoresearch.ideas.md`. Prune stale entries.

#### 8. Loop → step 1.

## Confidence scoring

After 3+ experiments, MAD-based confidence:
- ≥ 2.0x → improvement likely real
- 1.0-2.0x → above noise but marginal
- < 1.0x → within noise — re-run to confirm

Advisory only, never auto-discards.

## Context management

Pi sessions have finite context. After ~15 experiments, context is heavy.
- Save state proactively — all state in files
- Update `autoresearch.md`, commit, and stop
- Next session: read `autoresearch.md` + `autoresearch.jsonl` + `git log --oneline -20`

## Finalization

When the loop ends, create clean reviewable branches:

```bash
python3 autoresearch_helper.py summary --jsonl autoresearch.jsonl
```

Group kept experiments into logical changesets (no shared files between groups). For each group:

```bash
merge_base=$(git merge-base HEAD main)
git checkout -b autoresearch/finalize/<group-name> $merge_base
git checkout autoresearch/<session-branch> -- <files>
git commit -m "<group description>"
```

Verify each branch: run benchmark, confirm improvement holds, check merge. Original experiment branch preserved.

## Loop rules summary

- **LOOP FOREVER.** Never ask "should I continue?"
- **Primary metric is king.** Improved → keep. Worse → discard.
- **Annotate every run with ASI.** Record what you learned.
- **Watch confidence.** < 1.0x → re-run to confirm.
- **Simpler is better.** Removing code for equal perf = keep.
- **Don't thrash.** Repeatedly same idea? Try structurally different.
- **Think longer when stuck.** Re-read source, study data.
- **Resuming:** read state files, continue looping.
