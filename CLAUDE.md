# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pi Agent Control Extension — a Pi extension package providing routing, capture, verification, QA evidence, and showcase workflows for AI agents. It selects drivers (`agent-browser`, `tuistory`, `true-input`) based on task intent and produces structured evidence artifacts.

## Commands

| Command | Purpose |
|---|---|
| `npm run setup` | Install all dependencies including Remotion engine |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run validate` | Validate package structure, skills, and manifest (Python) |
| `npm run pack:dry` | Preview npm package contents |
| `npm run clean` | Clean caches and temp files |
| `npm run showcase:render` | Render a Remotion showcase video |

Run a single test file: `npx vitest run extensions/pi-control/routing.test.ts`

## Architecture

### Extension Entry Point

`extensions/pi-control/index.ts` — registers all slash commands and LLM tools with the Pi Extension API. The default export receives an `ExtensionAPI` instance and wires up:
- Commands (e.g., `/route-control`, `/capture`, `/showcase-render`)
- LLM tools (e.g., `control_route`, `control_recipe`)
- Event hooks (`session_start`, `tool_call` for guardrails)

### Core Modules (all in `extensions/pi-control/`)

- **routing.ts** — Rule-based router: matches task intent keywords to driver + skills + capture format + deliverable. Rules are ordered by specificity; later rules can override earlier ones. Supports negative keywords (`!term`).
- **guards.ts** — Security guardrails intercept `tool_call` events and block destructive patterns (rm -rf, .env access, cloud metadata IPs, curl-pipe-to-shell, reverse shells, etc.). Returns `{ block, reason }` to prevent execution.
- **capture.ts** — Unified capture orchestrator: routes target to driver, creates evidence directory, delegates to driver-specific capture, validates result against evidence schema.
- **bridge.ts** — WebSocket server for remote agent/CI integration. Token-authenticated, ping/pong keepalive, message types for capture/render/status.
- **recipes.ts** — Canonical workflow recipes (tuistory-launch, browser-loop, showcase-compose, qa-report) and commitment verification.
- **schema.ts** — Type definitions for `RouteDecision`, `ControlSkillName`, `SKILL_NAMES` constant, and `EVIDENCE_SCHEMA`.
- **skill-merge.ts** — 3-way merge for user vs PI skill overrides. Merge state persisted in `~/.config/devin/skill-studio.json`.
- **telemetry.ts** — Metrics registry with JSONL log output to `artifacts/telemetry/`.
- **utils.ts** — Shared utilities: `rootDir()` (memoized), `listSkills()` (memoized), `shellEscape()` (cross-platform), `runValidator()`, `buildUsageReport()`, `buildParallelVerifyReport()`.

### Tools (`extensions/pi-control/tools/`)

- **index.ts** — Registers all LLM tools with TypeBox parameter schemas.
- **browser.ts** — `agent-browser` guidance and status constants.
- **browser_command.ts** — Browser command tool implementation.
- **os.ts** — OS-level computer use guidance (prototype, ETA Q3 2026).

### Studio TUI (`extensions/pi-control/studio/`)

Ink-based terminal UI for skill management:
- **app.tsx** — Main app component with tab navigation.
- **panes/** — SkillList, SkillDetail, EvidencePane, ActionBar, StatusBar.
- **hooks/** — useFilter, useSkillRegistry.
- **model/skill.ts** — Skill data model.

### Skills (`skills/`)

25 skill directories, each with a `SKILL.md` file (YAML frontmatter with `name` and `description`). Skills are auto-discovered by reading `skills/*/SKILL.md`. Key skill groups:
- **Core control**: agent-browser, tuistory, true-input, capture, pty-capture, verify, compose, showcase
- **Meta/init**: init, wiki, review, autoresearch, session-navigation, meta-control
- **Agent orchestration**: ralph, agent-planner, agent-architect, agent-critic, agent-security-reviewer, e2e-tester
- **Infrastructure**: pi-agent-cli, pi-agent-control, background-pty, control-narrate

### Remotion (`remotion/`)

React-based video rendering engine for showcase videos. Separate npm package with its own dependencies. Recipes auto-select presets, layouts, and transitions.

### Binary Helpers (`bin/`)

- `tctl` — Terminal control wrapper for session management
- `skill-studio` — Launches the Ink TUI
- `control-narrate` — Narration helper
- `pi-agent-control` — CLI entry point

## Key Patterns

- **ES Modules only** — `"type": "module"` in package.json. All imports use `.ts` extensions.
- **TypeScript 6.0** with strict mode, `noImplicitAny`, `strictNullChecks`.
- **TypeBox** for LLM tool parameter schemas (peer dependency).
- **Memoization** — `rootDir()` and `listSkills()` cache results to avoid redundant filesystem calls.
- **Cross-platform shell escaping** — `shellEscape()` handles both POSIX and Windows.
- **Evidence contract** — Every run produces `artifacts/runs/<timestamp>-<slug>/` with `run.json`, `transcript.md`, `evidence/`, `verification.md`.

## Testing

- Tests are co-located: `*.test.ts` and `*.test.tsx` next to source files.
- Benchmarks: `*.bench.ts` files.
- E2E: `scripts/test-e2e.sh`.
- Python validation: `scripts/validate-package.py` (run via `npm run validate`).
- Coverage thresholds: 50% statements, 40% branches, 50% functions, 50% lines.

## Routing Model

The router uses priority-ordered rules:
1. High-specificity drivers (browser, true-input) — checked first
2. Generic terminal/tui — checked second, overridden by (1)
3. Deliverable types (video, qa) — modify deliverable regardless of driver
4. Target-specific skills (pi-agent-cli, init, wiki) — add skills
5. Meta operations (review, research) — override driver to "mixed"
6. Catch-all — ensures minimal skills are loaded

## Peer Dependencies

- `@earendil-works/pi-coding-agent` — host platform (never install as direct dep)
- `typebox` >= 0.30.0
