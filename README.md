# @groeponline/pi-agent-control-extension

![Brutalist UI Hero](docs/hero.png)


Pi Agent Control Extension operates as a strictly structured Pi extension package for terminal, CLI, browser-routing, capture, verification, QA proof, and showcase workflows. It enforces repeatable drivers, skill stacks, capture formats, and evidence recipes from unformatted automation requests.

[![CI](https://github.com/GroepOnline/pi-agent-control-extension/actions/workflows/ci.yml/badge.svg)](#)
[![npm](https://img.shields.io/npm/v/@groeponline/pi-agent-control-extension.svg)](https://www.npmjs.com/package/@groeponline/pi-agent-control-extension)
[![Pi package](https://img.shields.io/badge/Pi-package-9b59b6.svg)](https://pi.dev/packages/@groeponline/pi-agent-control-extension)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## // INSTALLATION

**Requirements:** Node.js 22+ and a compatible Pi coding-agent host.

```bash
pi install npm:@groeponline/pi-agent-control-extension
```

Initialize or reload a Pi session. Registers commands, tools, bundled skills, routing rules, and package validation functions.

## // WHERE IT FITS

This package owns **QA routing, terminal/browser capture, verification evidence, Skill Studio, and showcase workflows**. It does not own Pi session/model/tool-state control; use [`@groeponline/pi-control`](https://github.com/GroepOnline/pi-control) for that. It also does not own durable work state or multi-agent execution.

| Need | Package |
|---|---|
| Operator cockpit and short-lived idea capture | [`pi-wishcraft`](https://github.com/GroepOnline/pi-wishcraft) |
| Durable missions that survive sessions | [`pi-missions`](https://github.com/GroepOnline/pi-missions) |
| Multi-agent execution, worktrees, swarms, schedules | [`pi-agent-orchestrator`](https://github.com/GroepOnline/pi-agent-orchestrator) |
| Live Pi session/model/tool/state control | [`pi-control`](https://github.com/GroepOnline/pi-control) |
| QA evidence, capture drivers, showcase proof | **this package** |

A normal portfolio flow is `idea -> mission -> orchestration run -> evidence`. This package provides the evidence/capture end of that flow rather than another task store.

---

## // CAPABILITIES

| Area | Capability |
|---|---|
| Routing | Maps task intent to `tuistory`, `true-input`, or `agent-browser` |
| Capture | Forces outputs to casts, screenshots, mp4, or report-only evidence |
| Verification | Outputs commitment and evidence schemas for audit-friendly proof |
| QA | Enforces QA report structures with expected, observed, result, and evidence states |
| Showcase | Executes recipes for demo capture and Remotion-based composition |
| Guardrails | Intercepts risky capture and shell patterns prior to execution |
| Testing | Mandates unit, E2E, strict TypeScript (Vitest), and Ruff Python validation |

---

## // COMMANDS

| Command | Action |
|---|---|
| `/skills-control` | Outputs bundled skill atoms |
| `/route-control <task>` | Routes task to driver, skills, capture, deliverable, warnings, and recipe |
| `/capture <target> [--format mp4\|cast\|png\|report]` | Executes unified evidence capture; auto-selects driver and format |
| `/showcase-preview <recipe>` | Outputs showcase render props for a recipe |
| `/showcase-render <recipe>` | Executes a Remotion showcase video render from a recipe |
| `/skill-merge <name>` | Executes 3-way merge of a user skill with the PI version |
| `/merge-list` | Outputs all recorded skill merge states |
| `/bridge-start [--port]` | Initializes remote agent WebSocket bridge |
| `/bridge-status` | Outputs remote agent bridge status |
| `/demo-control` | Outputs canonical tuistory capture recipe |
| `/verify-control` | Outputs required verification and evidence schema |
| `/qa-control` | Outputs QA report template |
| `/doctor-control` | Executes package validator |

---

## // CAPTURE & SHOWCASE

Capture evidence with unified commands. The orchestrator inspects the target, determines the optimal driver (`agent-browser`, `tuistory`, or `true-input`), and outputs the evidence artifact.

```bash
/capture https://example.com --format mp4
/capture "npm run dev" --format cast
/capture "tui-story login" --format report
```

Supported formats: `mp4`, `cast`, `png`, `report`.
Results are strictly validated against the evidence schema and accessible in the Skill Studio TUI evidence pane.

### // SHOWCASE RENDERING

Convert a capture run into a Remotion showcase video. Recipes automate preset, layout, and transition selection.

```bash
/showcase-preview showcase-compose
/showcase-render showcase-compose
/showcase-render tuistory-launch artifacts/runs/run-2026-05-27/evidence/capture.cast
```

Available recipes: `tuistory-launch`, `browser-loop`, `showcase-compose`, `qa-report`.

Manual shell execution:
```bash
npm run showcase:render -- showcase-compose
```

---

## // SKILL MERGE

Resolve overrides between user skills and PI skills via 3-way merge.

```bash
/skill-merge agent-browser
/merge-list
```

Conflicts are presented with line-level context. Resolution requires `--pi`, `--user`, or `--manual`. Merge state is committed to `~/.config/devin/skill-studio.json`.
In the Skill Studio TUI, press `m` on a selected skill to initialize the merge sequence.

---

## // REMOTE AGENT BRIDGE

Exposes the extension via a WebSocket server for remote agent or CI system capture and render triggers.

```bash
/bridge-start 8765
/bridge-status
```

Connection target: `ws://localhost:8765?token=<TOKEN>`
Permitted message types: `ping`, `skill.list`, `capture.start`, `render.start`, `bridge.status`, `bridge.broadcast`.

---

## // LLM TOOLS

| Tool | Function |
|---|---|
| `control_route` | Routes a task programmatically |
| `control_recipe` | Outputs a canonical workflow recipe |
| `control_evidence_schema` | Outputs the evidence schema |
| `control_skill_index` | Outputs bundled skills and missing expected skills |
| `control_doctor` | Executes package validation |
| `control_verify_commitments` | Validates a verification report against core commitment and evidence sections |

---

## // SKILL ATOMS

**Control Skills:**
`agent-browser` · `capture` · `compose` · `pi-agent-cli` · `pi-agent-control` · `pty-capture` · `showcase` · `true-input` · `tuistory` · `verify`

**Advanced/Chained Skills:**
`init` · `wiki` · `review` · `autoresearch` · `session-navigation`

---

## // ARCHITECTURE & ROUTING

The project follows a **Clean Architecture** pattern (`src/core`, `src/drivers`, `src/extension`, `src/skill`). Consult [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive into the layer boundaries and universal routing keywords (`agent-cli`, `control-cli`, `tctl`, `agy`, `antigravity`).

```mermaid
graph TD
    A[User Task Intent] --> B{Router Logic}
    B -- "Web / Electron QA" --> C[agent-browser driver]
    C --> C1[screenshots]
    
    B -- "Ghostty / Wezterm / Vim" --> D[true-input driver]
    D --> D1[mp4 / raw PTY]
    
    B -- "CLI / TUI Snapshot" --> E[tuistory driver]
    E --> E1[asciicast / text snapshots]
    
    B -- "Chained Analysis" --> F[mixed driver]
    F --> F1[init + wiki + review + autoresearch]
```

---

## // EVIDENCE CONTRACT

Run execution strictly mandates a stable directory schema:

```text
artifacts/runs/<timestamp>-<slug>/
  run.json
  transcript.md
  evidence/
  verification.md
```

Claims must explicitly map to a step, driver, evidence file, result, and reason. Tasks are designated incomplete until visible evidence supports the specified commitment.

---

## // GUARDRAILS

The extension intercepts shell-style tool calls and explicitly blocks non-compliant patterns, including broad `rm -rf`, direct `.env` read/write operations, omitted `--repo-root` in pi-agent launches, and tuistory launches lacking color-preserving environment variables.

---

## // SECURITY HARDENING

Defense-in-depth is enforced across all user input and network I/O modules:

| Layer | Implementation |
|---|---|
| **Path Traversal** | Skill names adhere strictly to `^[a-zA-Z0-9_-]+$` preceding filesystem operations (`mergeSkill`, `resolveMerge`, `checkSkillUpdateConflict`). |
| **Path Traversal** | `showcaseRender` rejects `../` and absolute paths in `capturePath` and `outPath` prior to script execution. |
| **Memory Leaks** | WebSocket bridge flushes clients on `close` and `error` events; server faults trigger state reset. |
| **Resilience** | `capture.ts` enforces `try/catch` on `mkdirSync` — execution is non-fatal on failure. |
| **Input Validation** | `validateEvidence()` enforces length bounds, required fields, and format compliance against the schema. |
| **Shell Safety** | Driver modules isolate command string generation from execution. Direct `exec` calls are strictly prohibited; execution relies on the host shell or Pi tool system. |

---

## // PRIVACY & NETWORK BOUNDARY

The extension has no package-owned telemetry service. QA evidence and capture artifacts are local unless an operator explicitly points a driver or bridge at another endpoint. The WebSocket bridge is opt-in and bearer-token protected; exposing it outside a trusted local/network boundary is an operator decision.

`/showcase-render` uses the bundled Remotion workspace. A normal npm/Pi install does not auto-install that nested renderer workspace; when renderer dependencies are absent the command reports the requirement instead of attempting a broken render. A source checkout can enable rendering with `npm run setup`. The core control, routing, verification, and capture surfaces do not require a hosted ChefGroep control plane.

## // VALIDATE & TEST

```bash
# Validation
npm run validate
npm run pack:dry
npm run verify:package

# Unit Tests (Vitest & tsx)
npm test
npm run test:watch

# E2E Tests
npm run test:e2e

# Python Skills (unittest)
pytest packages/skills
```

`npm run validate` executes structure, manifest, skill inventory, and demo artifact verifications. `npm run verify:package` additionally inspects the actual npm tarball and fails if the Pi extension entrypoint, bundled skills, validator, or license would be omitted.

---

## // ROADMAP & FUTURE PLANS

Consult [ROADMAP.md](docs/ROADMAP.md) for architectural vectors, encompassing LLM-powered guardrails, native Playwright integration, and remote tmux orchestration.

---

## // DEMO

![Demo](artifacts/demo/demo.gif)
