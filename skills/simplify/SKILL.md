---
name: simplify
description: Review changed code for reuse, quality, and efficiency, then fix issues found. Use after making changes to clean up and improve code quality.
---
# Simplify: code review and cleanup

Review all changed files for reuse, quality, and efficiency. Fix issues found.

## Phase 1: Identify changes

Run `git diff` (or `git diff HEAD` for staged changes). If no git changes, review recently modified files from this conversation.

## Phase 2: Three review passes

Run all three in sequence against the diff:

### Pass 1: Code reuse

For each change:
1. Search for existing utilities that could replace new code. Common locations: utility directories, shared modules, adjacent files.
2. Flag new functions that duplicate existing functionality.
3. Flag inline logic that could use an existing utility — hand-rolled string manipulation, manual path handling, custom env checks, ad-hoc type guards.

### Pass 2: Code quality

1. **Redundant state**: state duplicating existing state, derived values that could be cached, observers/effects that could be direct calls.
2. **Parameter sprawl**: adding new params instead of generalizing.
3. **Copy-paste variation**: near-duplicate blocks that should be unified.
4. **Leaky abstractions**: exposing internals, breaking abstraction boundaries.
5. **Stringly-typed code**: raw strings where constants/enums/branded types exist.
6. **Unnecessary nesting**: wrapper elements that add no value.

### Pass 3: Efficiency

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate API calls, N+1 patterns.
2. **Missed concurrency**: independent ops run sequentially.
3. **Hot-path bloat**: new blocking work on startup or per-request paths.
4. **Recurring no-op updates**: state updates in loops/intervals that fire unconditionally.
5. **Unnecessary existence checks**: pre-checking file existence (TOCTOU) — operate directly and handle errors.
6. **Memory**: unbounded data structures, missing cleanup, event listener leaks.
7. **Overly broad operations**: reading entire files when a portion suffices.

## Phase 3: Fix issues

Aggregate findings and fix each directly. False positives → note and skip. Summarize what was fixed.
