---
title: Pi Agent Control Runtime Completion - Plan
type: fix
date: 2026-09-01
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Pi Agent Control Runtime Completion - Plan

## Goal Capsule
- **Objective:** Make the published control extension truthfully execute capture/bridge/background-session capabilities and verify real evidence artifacts.
- **Authority:** Current `main` behavior, package scripts, and driver E2E tests.
- **Stop if:** A change weakens shell/path safety, exposes credentials, or invents a dependency that is not shipped/documented.
- **Execution profile:** Proof-first fixes; preserve public command names and backwards-compatible result fields.
- **Tail:** Solari/provider integration and roadmap-only 4K/distributed-control features remain follow-up work.

## Product Contract

### Summary
The extension currently contains substantial routing, shell safety, terminal control, and rendering code, but several public surfaces overstate what actually happened. `/capture` produces a command plan and metadata validation rather than executing and proving an artifact; bridge `capture.start`/`render.start` return `started` without running work; `skill.list` is a stub; detached `tctl` sessions cannot be snapshotted through the normal path; and the true-input capture adapter targets a non-shipped executable instead of the existing `tctl` backend.

### Requirements
- **R1:** Keep `capture()` as a backwards-compatible plan builder, add an execution path that runs `commandParts` without a shell and returns truthful success/error state.
- **R2:** Evidence validation for executed captures must verify expected artifact files exist, are regular files, and are non-empty; metadata-only validation must not imply runtime success.
- **R3:** `/capture` must execute by default and display execution and artifact-validation failures instead of reporting a false positive.
- **R4:** Bridge `capture.start`, `capture.status`, `render.start`, and `render.status` must run actual operations with bounded in-memory job state; `skill.list` must return the real bundled skill registry.
- **R5:** `tctl --background` tuistory sessions must use Tuistory's native persistent daemon so snapshot/wait/type/press/close target the same named session.
- **R6:** The true-input capture adapter must use a capability that the package actually ships/validates; unsupported capture shapes must fail explicitly rather than claim validation.
- **R7:** Existing package validation, lint/typecheck, unit tests, package contract, and real driver E2E must pass from the worktree.

### Acceptance Examples
- **AE1:** Given a driver command creates an evidence file, when capture execution completes, then the result is successful only when the file exists and contains bytes.
- **AE2:** Given a missing driver binary, when `/capture` runs, then it reports execution failure and `validated=false`.
- **AE3:** Given a bridge client starts capture, when the client polls the returned job id, then status progresses to `completed` or `failed` with the actual result/error.
- **AE4:** Given a `tctl --background` tuistory session, when snapshot is requested after launch, then output from the detached command is returned.
- **AE5:** Given a true-input target on a host without a supported true-input terminal stack, capture fails explicitly and never emits a validated evidence claim.

### Success Criteria
- No public operation returns `started`, `validated`, or `success` unless the corresponding operation actually ran or the field is explicitly scoped as structural-only.
- Detached terminal smoke test passes repeatedly.
- Full package verification is green.

### Key Decisions
- Preserve `capture()` as a synchronous planning helper for existing callers/tests; introduce `executeCapture()` for real runtime execution.
- Use `execFile`/argument arrays only; no shell interpolation.
- Add expected artifact paths to capture results rather than trying to infer filenames from free-form command strings.
- For detached Tuistory sessions, use Tuistory's native `--background --no-wait` daemon path; do not wrap Tuistory in tmux because that bypasses its named-session registry.

### Scope Boundaries
**In scope**
- `packages/extension/capture.ts`
- `packages/extension/control_evidence_schema.ts`
- `packages/extension/bridge.ts`
- `packages/extension/browser.ts`
- `packages/extension/tuistory.ts`
- `packages/extension/true-input.ts`
- `bin/tctl`
- directly related tests and E2E scripts

**Out of scope**
- New Solari integration
- New GUI product UI
- 4K/60fps capture roadmap
- Distributed SSH orchestration

## Planning Contract

### Assumptions
- `agent-browser` may legitimately be optional; absence must be surfaced, not hidden.
- `tctl` is the canonical terminal-control entrypoint shipped by this package.
- Bridge job state can remain process-local for this release; durability is a separate concern.

### High-Level Technical Design
`capture()` builds a typed execution plan → `executeCapture()` executes each safe argv step → expected artifacts are validated → result is returned to Pi command or bridge job. Bridge maintains bounded job records and delegates to the same execution/render functions. Background `tctl` uses Tuistory's native daemon-backed named sessions, preserving the same control endpoint for later snapshot/wait/type/press/close operations.

### Sequencing
U1 establishes truthful capture/evidence contracts. U2 fixes tctl and driver alignment. U3 wires bridge operations to the real executors. U4 runs and hardens all gates.

## Implementation Units

### U1. Execute and verify captures
**Goal:** Add real capture execution and file-backed evidence validation.
**Requirements:** R1, R2, R3
**Dependencies:** none
**Files:** `packages/extension/capture.ts`, `packages/extension/control_evidence_schema.ts`, driver files, corresponding tests
**Approach:** Extend result shape compatibly with expected artifacts, execution status/output/error; implement sequential `execFile` execution; validate artifacts only after successful execution.
**Execution note:** Add failing tests first for metadata-only false positives, missing binaries, and zero-byte/missing artifacts.
**Patterns to follow:** `packages/extension/tools/shell_command.ts` no-shell execution and timeout/error handling.
**Test scenarios:** plan-only capture remains compatible; successful argv execution; failed binary; missing artifact; empty artifact; report/cast/png paths.
**Verification:** focused Vitest files plus typecheck.

### U2. Repair terminal driver runtime
**Goal:** Make detached tuistory control work and align true-input capture with shipped `tctl` capabilities.
**Requirements:** R5, R6
**Dependencies:** U1 result contract
**Files:** `bin/tctl`, `packages/extension/tuistory.ts`, `packages/extension/true-input.ts`, `scripts/test-e2e.sh`, tests
**Approach:** Use Tuistory's native daemon-backed `--background --no-wait` sessions so later control commands target the same session; remove dependency on a phantom `true-input` executable and model unsupported operations explicitly.
**Execution note:** Reproduce the existing detached E2E failure before changing code.
**Test scenarios:** foreground tuistory unchanged; background snapshot succeeds; close cleans state; unsupported true-input environment fails truthfully.
**Verification:** `npm run test:e2e` and focused tests.

### U3. Complete bridge operations
**Goal:** Replace bridge placeholder responses with real capture/render jobs and actual skill listing.
**Requirements:** R4
**Dependencies:** U1
**Files:** `packages/extension/bridge.ts`, bridge tests
**Approach:** Maintain bounded job map keyed by id; start async capture/render operations; expose status/results; populate skills through existing registry helpers.
**Execution note:** Preserve token/auth behavior and loopback binding.
**Test scenarios:** start→completed; start→failed; unknown job; bounded retention; skill list non-empty; existing auth/status behavior.
**Verification:** bridge tests and full unit suite.

### U4. Package-wide deterministic verification
**Goal:** Finish with all advertised package gates green.
**Requirements:** R7
**Dependencies:** U1-U3
**Files:** only tests/config that are proven flaky or incorrect during verification
**Approach:** Run lint, full tests, validate, verify:package, and driver E2E; fix root causes without simply loosening assertions.
**Verification:** all named commands exit 0.

## Verification Contract
| Gate | Scope | Done signal |
|---|---|---|
| Type safety | extension code | `npm run lint` exits 0 |
| Unit/integration | package | `npm test` exits 0 |
| Structural package | package metadata/assets | `npm run validate` exits 0 |
| Packed contract | published files | `npm run verify:package` exits 0 |
| Real driver smoke | tctl foreground/background | `npm run test:e2e` exits 0 |

## Definition of Done
- [ ] Capture execution produces and validates actual evidence or returns a truthful failure.
- [ ] Bridge operations are no longer placeholders.
- [ ] Background tctl smoke passes.
- [ ] True-input adapter uses a shipped capability or explicitly reports unsupported behavior.
- [ ] All package gates pass from the isolated worktree.
