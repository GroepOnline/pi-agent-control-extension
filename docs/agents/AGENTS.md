# AGENTS.md — Pi Agent Control Extension (agent docs)

> Routing, capture, and verification for Pi agents — browser/TUI automation, skill merge, remote bridge. **Spawn config SSOT:** [`pi-agent-orchestrator/AGENTS.md`](../../../pi-agent-orchestrator/AGENTS.md).

## Pre-context (read first)

Pi extension package: slash commands, LLM tools, 21 atomized skills in `packages/skills/`, Remotion showcase in `apps/remotion/`.

| Rule | Detail |
|------|--------|
| **Entry** | `src/extension/index.ts` — registers `/route-control`, `control_route`, etc. |
| **Routing SSOT** | `src/core/routing/routing.ts` — maps intent → drivers |
| **Never** | Placeholder paths; doubt tool availability (run `npm run setup` / `doctor-control`) |

## Sub-agent pre-context matrix (Pi stack)

| Layer | Package / repo | Injected at spawn | This repo's role |
|-------|----------------|-------------------|------------------|
| **Orchestrator** | `pi-agent-orchestrator` | Permissions, parent log | Spawns sub-agents with control skills when `skills: true` |
| **Subagent TUI** | `@groeponline/pi-subagents-tui` | Parent telemetry | Monitor long `tuistory` / browser sessions |
| **Memory hooks** | `Pi-Helios-Memory-Private` + context-mode | Prior routing decisions, failure memories | `ctx_search` before repeat automation |
| **Control extension** | **this repo** | `agent-browser`, `tuistory`, `true-input`, `tctl`, capture skills | `/route-control` · `control_browser_command` |

## Skills (install paths)

| Task | Skill path |
|------|------------|
| **Meta routing** | `packages/skills/meta-control/SKILL.md` |
| **Browser automation** | `packages/skills/agent-browser/SKILL.md` |
| **Terminal TUI** | `packages/skills/tuistory/SKILL.md` · `packages/skills/true-input/SKILL.md` |
| **PTY / background** | `packages/skills/background-pty/SKILL.md` · `packages/skills/pty-capture/SKILL.md` |
| **Showcase video (UI)** | `packages/skills/showcase/SKILL.md` · `apps/remotion/` |
| **Notion / Linear bridge** | `packages/skills/notion-linear-bridge/SKILL.md` |
| **Repo agent skills** | `.agents/skills/testing-pi-control-tools/SKILL.md` · `testing-notion-linear/SKILL.md` |
| **Spawn config** | `../../../pi-agent-orchestrator/AGENTS.md` |
| **Global** | `~/.agents/skills/agent-browser` · `agent-e2e-tester` |

**Taste:** No `taste-skill` except **UI-facing** work — `showcase` / Remotion demos only. Public marketing copy → `chefgroep.nl` taste skills.

## Spawn rules

**SSOT:** [`pi-agent-orchestrator/AGENTS.md`](../../../pi-agent-orchestrator/AGENTS.md).

**Parallel subagents (this repo):** minimum **4** on routing/driver/skill changes:

| Role | When | Spawn type |
|------|------|------------|
| **control-routing** | `routing.ts`, guards, intent mapping | `Explore` |
| **control-drivers** | `browser.ts`, `tuistory`, `true-input` | `Explore` |
| **control-skills** | `packages/skills/*`, skill-merge | `Plan` |
| **control-implement** | After audit | `general-purpose` |

**CHEF-98 site-wide:** **≥4** parallel agents when control copy or showcase touches `chefgroep.nl` — [`chefgroep.nl/AGENTS.md`](../../../chefgroep.nl/AGENTS.md).

## Verify

```bash
npm run lint && npm run test && npm run validate
```

## CHEF

Branch `chore/agent-fleet-a4-pi-stack` or `CHEF-<n>-slug` · PR `Fixes CHEF-<n>`.

## Core Principles

1. **Absolute Confidence**: Assume all tools (`tctl`, `tuistory`, etc.) are available or can be made available. If a tool is missing, run `npm run setup` or `doctor-control`, install it, and proceed. Never apologize or doubt the environment.
2. **Autonomous Recovery**: If a command fails due to a missing dependency, fix it yourself. You have the `run_command` tool. Use it to install what is needed.
3. **No Placeholders**: Never use placeholder paths or session names. Use absolute paths and unique run IDs as described in the skills.

## Commands

- `npm run setup`: Install all dependencies including the Remotion engine.
- `npm run test`: Run all 593 tests (vitest).
- `npm run validate`: Validate package structure, skills, and manifest.
- `npm run check`: Verify the extension entry point via `pi` CLI.
- `npm run lint`: Run TypeScript type checking (`tsc --noEmit`).
- `npm run pack:dry`: Preview the files included in the npm package.

## Architecture

This project is a Pi extension package that provides routing, capture, and verification capabilities for AI agents.

### Core Components

- **Extension Entry Point ([index.ts](src/extension/index.ts))**: Registers slash commands (e.g., `/route-control`, `/browser-control`) and LLM tools (e.g., `control_route`, `control_browser_command`) with the Pi Extension API.
- **Routing ([routing.ts](src/core/routing/routing.ts))**: Contains the logic for mapping user task intents to specific drivers (`agent-browser`, `tuistory`, `true-input`).
- **Browser Control ([browser.ts](src/drivers/browser/browser.ts))**: Provides native tools and guidance for web and Electron automation.
- **Guardrails ([guards.ts](src/core/verify/guards.ts))**: Security checks for destructive actions and sensitive data access (including cloud metadata IPs).
- **Skill Merge ([skill-merge.ts](src/skill/skill-merge.ts))**: 3-way merge engine with patience-diff anchors for resolving user vs PI skill overrides.
- **Remote Bridge ([bridge.ts](src/extension/bridge.ts))**: WebSocket server for remote agent communication with token-based auth.
- **CLI ([cli.ts](src/extension/cli.ts))**: Skill Studio TUI and skill management commands.

### Core Assets

- **`bin/`**: Contains the `tctl` terminal control wrapper and other binary helpers.
- **`apps/remotion/`**: A React-based video rendering engine for creating showcase videos.
- **`skills/`**: 21 atomized skill definitions registered automatically.

### Validation

The project uses a Python-based validator ([validate-package.py](scripts/validate-package.py)) to ensure all required files, skills, and manifest entries are present.
