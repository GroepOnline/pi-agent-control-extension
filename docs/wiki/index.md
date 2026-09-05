# pi-agent-control-extension

Pi extension for terminal, CLI, browser routing, capture, QA evidence, verification, usage observability, and the control hub. This is the GroepOnline fork, installed as a git package (`git:github.com/GroepOnline/pi-agent-control-extension`).

## What this extension does

It turns a Pi session into a proof-driven automation loop:

1. **Route** — map a free-text task to a driver, capture format, deliverables, and skill atoms (`control_route`, `/route-control`).
2. **Capture** — record ground truth with the right driver: `tuistory` (deterministic TUI PTY + `.cast`), `true-input` (real terminal emulator key-encoding proofs), or `agent-browser` (web screenshots / Electron).
3. **Compose** — build polished showcase videos from raw captures with the Remotion pipeline (`apps/remotion`, `/showcase-render`).
4. **Verify** — check commitments are backed by visible evidence (`control_verify_commitments`, `/verify-control`, `/qa-control`).
5. **Observe** — estimate token/cost usage and suggest cheaper loop choices (`control_usage`, `/usage`).

Plus a **Skill Studio** (`/skill-studio`, `bin/skill-studio`): a fullscreen terminal dashboard that browses, diffs, merges, and manages bundled + user skill atoms.

## Entry points

| Surface | Path | Purpose |
|---|---|---|
| Extension bootstrap | `packages/extension/index.ts` | registers all commands, tools, capture/bridge, tool-call guards |
| Tools (`control_*`) | `packages/extension/tools/` + `control_evidence_schema.ts` | MCP-style tools for routing, verification, usage, OS/browser control |
| Slash commands (`/…`) | `packages/extension/index.ts` | human-facing equivalents of the tools |
| Routing engine | `packages/extension/routing.ts` | keyword-rule task → `RouteDecision` |
| Skill Studio CLI | `packages/extension/cli.ts` | `list | view | enable | disable | diff | merge | validate` |
| Skill Studio TUI | `packages/extension/studio/` | Ink fullscreen registry dashboard |
| Capture routing | `packages/extension/capture.ts` | driver dispatch + evidence validation |
| Bridge | `packages/extension/bridge.ts` | token-authenticated WebSocket control surface |
| Guard kernel | `packages/extension/guards.ts` | blocks destructive shell patterns on tool calls |
| Package validator | `scripts/validate-package.py` | structural gate (`/doctor-control`, `control_doctor`) |

## Quick start for agents

- Task says *browser* → route gives driver `agent-browser`, skill `agent-browser`, capture `screenshots`.
- Task says *terminal TUI* → driver `tuistory`, capture `cast`.
- Task says *key encoding / escape sequence* → driver `true-input`, capture `mp4`.
- Task says *video / showcase* → deliverable `showcase-video`, skills `showcase + compose + verify`.
- Unknown → default driver `tuistory` with a `proof-report` deliverable.

Always create a run directory first: `artifacts/runs/<timestamp>-<slug>/` with `run.json`, `transcript.md`, `evidence/`, `verification.md` (see [testing-and-evidence.md](./testing-and-evidence.md)).

## Pages

- [architecture.md](./architecture.md) — component map, tool/skill flow, guardrails
- [skills-catalog.md](./skills-catalog.md) — all 20 bundled skill atoms
- [routing-logic.md](./routing-logic.md) — rules, drivers, recipes, warnings
- [testing-and-evidence.md](./testing-and-evidence.md) — checks, evidence schema, QA