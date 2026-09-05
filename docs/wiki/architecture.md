# Architecture

## Component map

```mermaid
graph TD
    subgraph Surfaces
        CMDS["/commands<br/>(route-control, skill-studio, os-control, …)"]
        TOOLS["control_* tools<br/>(route, recipe, verify, usage, os, browser)"]
        STUDIO["Skill Studio TUI<br/>(packages/extension/studio)"]
        SCLI["Skill Studio CLI<br/>(packages/extension/cli.ts)"]
    end

    subgraph Core
        IDX["index.ts<br/>bootstrap + registrations"]
        RT["routing.ts<br/>routeControlTask"]
        RC["recipes.ts<br/>recipeFor / verifyCommitments"]
        SC["schema.ts<br/>SKILL_NAMES, EVIDENCE_SCHEMA, RouteDecision"]
        UT["utils.ts<br/>rootDir, listSkills, runValidator, usage"]
        GD["guards.ts<br/>inspectToolCall / checkShellCommand"]
    end

    subgraph Drivers
        TUI1["tuistory<br/>(virtual PTY, .cast)"]
        TIN["true-input<br/>(headless Wayland, mp4)"]
        BR["agent-browser<br/>(web/Electron, screenshots)"]
        OS["os-control / tmux"]
    end

    subgraph Skills
        SK["packages/skills/*<br/>(20 atoms)"]
    end

    subgraph Evidence
        EV["artifacts/runs/*<br/>run.json + transcript.md + evidence/ + verification.md"]
        REM["apps/remotion<br/>(showcase render)"]
    end

    CMDS --> IDX
    TOOLS --> IDX
    IDX --> RT --> SC
    IDX --> RC --> SC
    IDX --> UT
    IDX --> GD
    IDX --> TUI1 & TIN & BR & OS
    IDX --> SK
    IDX --> EV
    IDX --> REM
    STUDIO --> SCLI
    SCLI --> SK
    SCLI --> UT
```

## Execution flow

```mermaid
sequenceDiagram
    participant U as Agent/User
    participant I as index.ts
    participant R as routing.ts
    participant C as capture.ts
    participant D as Driver (tuistory/true-input/browser)
    participant E as Evidence dir
    participant V as verify (control_verify_commitments)

    U->>I: control_route(task)
    I->>R: routeControlTask(task)
    R-->>I: RouteDecision (driver, skills, capture, deliverable, warnings, recipe)
    I-->>U: routed plan
    U->>I: control/capture command
    I->>C: routeToDriver(target)
    C->>D: capture (cast/mp4/screenshots)
    D-->>C: artifact
    C-->>E: write run.json / transcript.md / evidence/
    U->>I: control_verify_commitments(verification.md)
    I->>V: structural checks
    V-->>U: PASS/FAIL + missing sections
```

## Guard kernel

`guards.ts` hooks `pi.on("tool_call")` and inspects every shell-shaped tool call. `checkShellCommand` returns a block decision with a reason, or `null` when allowed.

Blocked patterns (non-exhaustive):

- `rm -rf` / `rm -fr` with `/`, `~`, `..`, `*`, `./` targets — full-path deletes require narrowing.
- `.env*` file access via read/write/edit tools (`cat`, `sed`, `grep`, `cp`, `>`, `tee`, `vim`, …).

Additional guards across the extension:

- `shellEscape` (utils.ts) — POSIX/Windows-safe quoting for any shelled-out argument.
- `showcaseRender` — rejects `..` / absolute path traversal in capture/out paths.
- Skill-name validation (`/^[a-zA-Z0-9_-]+$/`) everywhere a skill name is accepted.
- Bridge (`bridge.ts`) — WebSocket control plane authenticated with a token at `~/.config/devin/bridge-token`, compared with `timingSafeEqual`.
- `control_shell_command` tool — command allowlist, sensitive-path blocklist, cwd restriction (see `tools/shell_command.ts`).
- `runValidator` executes `scripts/validate-package.py` from `PACKAGE_ROOT` with no parameter injection.

## Skill registry & Skill Studio

- Bundled atoms live in `packages/skills/<name>/SKILL.md`; the registry (`listSkills` in utils.ts) reads name + description, memoized per base dir.
- The Studio scans `packages/skills` as the `pi` source, plus user trees `~/.agents/skills` (global), `~/.devin/skills`, `~/.claude/skills`.
- Shadow semantics: a user skill with the same name as a bundled skill is `overrides` (or the bundled one is `shadowed`). Same-name skills across user dirs are collapsed to one row (preferring `~/.agents`).
- State (disabled set, merge records) persists in `~/.config/devin/skill-studio.json`.
- `skill-merge.ts` implements a naive line-by-line 3-way merge (git merge-base when available) with `<<<<<<< PI` / `>>>>>>> USER` conflict markers, plus `/skill-merge-resolve --pi|--user|--manual`.

## Observation & cost

`buildUsageReport` (utils.ts) computes billable input = `promptTokens − cachedInputTokens`, then input/output cost from per-million rates. `control_usage` returns the text report plus a `details` object. The OCD advice: text snapshots before mp4, and verify before rerunning a capture loop.