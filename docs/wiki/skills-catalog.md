# Skills Catalog

20 bundled skill atoms in `packages/skills/`. Each file is a Pi `SKILL.md` with a trigger description; the routing engine (see [routing-logic.md](./routing-logic.md)) attaches them to tasks, and they also surface in Pi's skill picker.

## Orchestration / meta

| Skill | Purpose |
|---|---|
| [agy-agent-control](../../packages/skills/agy-agent-control/SKILL.md) | Main orchestrator: route → chain capture, compose, verify atoms. Entry skill for any "record a demo / QA proof / control workflow" ask. |
| [meta-control](../../packages/skills/meta-control/SKILL.md) | Optimize Pi's own use of this extension and its subagents. |
| [init](../../packages/skills/init/SKILL.md) | Initialize a Pi workspace: extension scaffolding, prompt templates, Pi-tuned AGENTS.md. |
| [wiki](../../packages/skills/wiki/SKILL.md) | Generate a Pi-centric codebase documentation wiki (`docs/wiki/`). |

## Capture drivers

| Skill | Purpose |
|---|---|
| [capture](../../packages/skills/capture/SKILL.md) | Start a recording: TUI sessions, browser interactions, screenshots, demo proofs. |
| [tuistory](../../packages/skills/tuistory/SKILL.md) | Deterministic TUI automation via virtual PTY; text snapshots and `.cast` recordings. |
| [true-input](../../packages/skills/true-input/SKILL.md) | Real terminal emulator automation (headless Wayland) for keyboard-encoding proofs. |
| [pty-capture](../../packages/skills/pty-capture/SKILL.md) | Capture ground-truth PTY bytes / escape sequences from real emulators. |
| [agent-browser](../../packages/skills/agent-browser/SKILL.md) | Web + Electron automation: navigate, screenshot, click, fill, record. |
| [background-pty](../../packages/skills/background-pty/SKILL.md) | Persistent detached terminal sessions via tmux/dtach for async workflows. |

## Compose / showcase

| Skill | Purpose |
|---|---|
| [compose](../../packages/skills/compose/SKILL.md) | Assemble polished demo videos from raw captures with Remotion (title cards, transitions, chrome). |
| [showcase](../../packages/skills/showcase/SKILL.md) | Polish demo videos: branded window chrome, animations, cinematic backgrounds; marketing/PR assets. |
| [control-narrate](../../packages/skills/control-narrate/SKILL.md) | After a verified pass, auto-generate a cinematic showcase video from `verification.md` + `run.json` (v0.1 rule-based heuristic). |

## Verification & QA

| Skill | Purpose |
|---|---|
| [verify](../../packages/skills/verify/SKILL.md) | Verify final deliverables against commitments: video proofs, screenshots, QA reports. |
| [review](../../packages/skills/review/SKILL.md) | Code review focused on Pi extension safety, tool guardrails, optimal API usage. |
| [ralph](../../packages/skills/ralph/SKILL.md) | Review-Approve Loop Protocol: Plan → Critique → Revise → Approve hardening cycles. |

## Session / control plane

| Skill | Purpose |
|---|---|
| [session-navigation](../../packages/skills/session-navigation/SKILL.md) | Find historical context, navigate/search/manage Pi sessions and past decisions. |
| [agy-agent-cli](../../packages/skills/agy-agent-cli/SKILL.md) | Antigravity agent CLI target atom: launch, print mode, slash commands, reproducible capture via `tctl`. |
| [network-audit](../../packages/skills/network-audit/SKILL.md) | Deep network audit and remediation (canonical version lives in techstack-inventory-private; this delegates). |
| [notion-linear-bridge](../../packages/skills/notion-linear-bridge/SKILL.md) | Bidirectional Notion ↔ Linear sync and automation for tasks/projects/docs. |

## Expected-skill contract

`scripts/validate-package.py` pins the expected set of 20 atoms (`EXPECTED_SKILLS`) and fails `/doctor-control` if any is missing. `SKILL_NAMES` in `packages/extension/schema.ts` is the routing-eligible subset (authored atoms without a route keyword still list via `control_skill_index` / `/skills-control`).

## Skill hygiene

- `skill-diff <name>` — diff user version vs bundled version (looks in `~/.gemini/config/skills`, `~/.agents`, `~/.devin`, `~/.claude`).
- `skill-merge <name>` — 3-way merge a user skill with its PI version; `merge-list` shows recorded states.
- `skill-search <query>` / `skill-info <name>` — registry lookup helpers.
- Skill Studio (`/skill-studio`) — fullscreen browse/diff/merge/disable dashboard over bundled + user trees.