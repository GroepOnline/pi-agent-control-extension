# Pi Agent Control Extension

Pi Agent Control Extension is a Pi extension package for terminal, CLI, browser-routing, capture, verification, QA proof, and showcase workflows. It provides commands and LLM tools that turn loose automation requests into a repeatable driver, skill stack, capture format, and evidence recipe.

[![CI](https://github.com/OnlineChef/pi-agent-control-extension/actions/workflows/ci.yml/badge.svg)](#)
[![Package](https://img.shields.io/badge/pi-extension-blue)](#)
[![Version](https://img.shields.io/badge/version-5.1.1-informational)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#)

## Install

```bash
pi install git:github.com/OnlineChef/pi-agent-control-extension
```

Then start or reload a Pi session. The extension registers commands, tools, bundled skills, routing rules, and package validation helpers.

## What it gives you

| Area | Capability |
|---|---|
| Routing | Selects `tuistory`, `true-input`, or `agent-browser` from the task intent |
| Capture | Recommends casts, screenshots, mp4, or report-only evidence |
| Verification | Produces commitment and evidence schemas for audit-friendly proof |
| QA | Generates QA report structures with expected, observed, result, and evidence columns |
| Showcase | Provides recipes for demo capture and Remotion-based composition |
| Guardrails | Blocks risky capture and shell patterns before they become expensive mistakes |
| Testing | Fully unit, E2E, strict TypeScript, and Ruff Python tested in CI/CD |

## Commands

| Command | What it does |
|---|---|
| `/skills-control` | Lists bundled skill atoms |
| `/route-control <task>` | Routes a task to driver, skills, capture, deliverable, warnings, and recipe |
| `/capture <target> [--format mp4|cast|png|report]` | Unified evidence capture: auto-selects driver and format |
| `/demo-control` | Shows the canonical tuistory capture recipe |
| `/verify-control` | Shows the required verification and evidence schema |
| `/qa-control` | Shows the QA report template |
| `/doctor-control` | Runs the package validator |

## Capture & Showcase

Capture evidence with a single command. The orchestrator inspects your target, picks the right driver (`agent-browser`, `tuistory`, or `true-input`), and generates the evidence artifact.

```bash
/capture https://example.com --format mp4
/capture "npm run dev" --format cast
/capture "tui-story login" --format report
```

Supported formats: `mp4`, `cast`, `png`, `report`.

The result is validated against the evidence schema and can be viewed in the Skill Studio TUI evidence pane.

## LLM tools

| Tool | Purpose |
|---|---|
| `control_route` | Route a task programmatically |
| `control_recipe` | Return a canonical workflow recipe |
| `control_evidence_schema` | Return the evidence schema |
| `control_skill_index` | List bundled skills and missing expected skills |
| `control_doctor` | Run package validation |
| `control_verify_commitments` | Check a verification report for core commitment and evidence sections |

## Skill atoms

Control skills:

`agent-browser` · `capture` · `compose` · `pi-agent-cli` · `pi-agent-control` · `pty-capture` · `showcase` · `true-input` · `tuistory` · `verify`

Advanced/Chained skills:

`init` · `wiki` · `review` · `autoresearch` · `session-navigation`

## Routing model

Three lookups drive most decisions: intent, required proof format, and target runtime.

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


## Evidence contract

Every run should produce a stable run directory:

```text
artifacts/runs/<timestamp>-<slug>/
  run.json
  transcript.md
  evidence/
  verification.md
```

Each claim should map to a step, driver, evidence file, result, and reason. Do not mark a task complete until visible evidence supports the stated commitment.

## Guardrails

The extension inspects shell-style tool calls and blocks known unsafe patterns, including broad `rm -rf`, direct `.env` reads or edits, missing `--repo-root` in pi-agent launches, and tuistory launches that omit color-preserving environment variables.

## Validate

```bash
npm run validate
npm run pack:dry
```

`npm run validate` checks the package structure, required files, manifest entries, skill inventory, and demo artifact.

## Roadmap & Future Plans

Interested in what's next for the extension? Check out our [ROADMAP.md](ROADMAP.md) for upcoming features like LLM-powered guardrails, native Playwright integration, and remote tmux orchestration.

## Demo

![Demo](artifacts/demo/demo.gif)
