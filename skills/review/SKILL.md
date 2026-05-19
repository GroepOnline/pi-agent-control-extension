---
name: review
description: Review code changes and identify high-confidence, actionable bugs. Use when reviewing pull requests, branch diffs, or finding bugs/security/correctness problems. Structured summary with bug patterns and severity.
---
# Code review

Senior staff engineer code review. Identify high-confidence, actionable bugs.

## Setup

1. Get context: branch, target/base branch, PR description/issues.
2. Get diff: `git diff $(git merge-base HEAD <base-branch>)..HEAD`
3. Review all changed files methodically.

## Review focus

- Functional correctness, logic bugs, syntax errors
- Broken dependencies, contracts, or tests
- Security issues and performance problems

## High-signal bug patterns

Only flag issues you're confident about. No speculative or stylistic nitpicks.

- **Null/undefined safety**: dereferences on optional types, missing-key errors on JSON, unchecked `.find()` / `.get()` / array index
- **Resource leaks**: unclosed files/streams/connections; missing cleanup on error paths
- **Injection**: SQL injection, XSS, command/template injection, auth/security invariant violations
- **OAuth/CSRF**: state must be per-flow unpredictable; flag deterministic or missing state checks
- **Concurrency**: TOCTOU, lost updates, unsafe shared state, process/thread lifecycle bugs
- **Missing error handling**: network, persistence, auth, migrations, external APIs
- **Wrong-variable/shadowing**: variable name mismatches, contract mismatches
- **Type-assumption bugs**: numeric ops on datetime/strings, ordering-key type mismatches, object ref comparison
- **Offset/cursor/pagination**: off-by-one, prev/next behavior, commit semantics
- **Async/await**: `forEach`/`map`/`filter` with async callbacks (fire-and-forget), missing `await`, unhandled promise rejections

## Analysis patterns

### Logic & variables
Verify correct variable in each conditional, AND vs OR confusion, return statements return intended values.

### Null/undefined
For each `a.b.c` access, verify no intermediate can be null. Check auth contexts, optional relationships, map lookups, config values.

### Type compatibility
Trace types into math ops, verify comparison operators match types, check serialization/deserialization consistency.

### Async/await
Flag `forEach`/`map`/`filter` with async callbacks. Verify all async calls are awaited when result/side-effect is needed.

### Security
SSRF: unvalidated URL fetching with user input. XSS: unescaped user input in HTML. Auth: OAuth state must be per-request random; CSRF tokens verified. Timing: constant-time secret comparison. Cache poisoning: no asymmetric security caching.

### API contracts
When serializers change: verify response compatibility. When DB schemas change: verify migrations include backfill. When signatures change: grep all callers.

## Analysis discipline

Before flagging:
1. Verify with grep/read — don't speculate
2. Trace data flow to confirm real trigger path
3. Check existing tests and calling code
4. Confirm it's a real bug, not a style preference

## Output format

For each finding: file + line range, severity (critical/high/medium/low), what's wrong, how to fix, confidence level.
