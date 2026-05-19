# Pi Agent Control Extension

Pi Agent Control Extension is a Pi extension package for terminal, CLI, browser-routing, capture, verification, QA proof, and showcase workflows. It provides commands and LLM tools that turn loose automation requests into a repeatable driver, skill stack, capture format, and evidence recipe.

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

## Commands

| Command | What it does |
|---|---|
| `/skills-control` | Lists bundled skill atoms |
| `/route-control <task>` | Routes a task to driver, skills, capture, deliverable, warnings, and recipe |
| `/demo-control` | Shows the canonical tuistory capture recipe |
| `/verify-control` | Shows the required verification and evidence schema |
| `/qa-control` | Shows the QA report template |
| `/doctor-control` | Runs the package validator |

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

| Route | Example task | Driver | Capture |
|---|---|---|---|
| Web or Electron | Browser QA test with screenshots | `agent-browser` | screenshots |
| Real terminal | Ghostty key encoding or escape sequence proof | `true-input` | mp4 or raw PTY evidence |
| TUI or CLI | Pi demo recording, pi-agent snapshot, terminal stream proof | `tuistory` | asciicast and text snapshots |


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

## Demo

![Demo](artifacts/demo/demo.gif)
