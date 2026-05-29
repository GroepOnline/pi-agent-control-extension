# External Contract Map — Pi Agent Control Extension (v5.1.4)

**Purpose**: This document captures the hard, non-negotiable invariants that any new feature proposal (especially the 4 Unique Features) **must** declare deltas against. It was created as the #1 required artifact in Phase A of the Ralph-approved plan after reviewer feedback on validator rigidity, guards sacred kernel, tctl/PTY surface, and packaging tax.

**Date**: 2026-05-28 (Ralph Loop Iteration 1)
**Source of truth**: Current state on `feat/v5.1.4-security-audit`

---

## 1. Package Validator Contract (`scripts/validate-package.py`)

This is the single most rigid gate. Any proposal that touches files, skills, or manifest entries will be rejected at `npm run validate` unless explicitly updated here.

### EXPECTED_SKILLS (17 — exact set, no more, no less for the gate)
```python
{
    "agent-browser", "capture", "compose", "pi-agent-cli", "pi-agent-control",
    "pty-capture", "showcase", "true-input", "tuistory", "verify",
    "init", "wiki", "review", "autoresearch", "session-navigation",
    "background-pty", "meta-control"
}
```
- Note: The `network-audit/` report on this branch contains an extra SKILL.md. Extras are tolerated in the filesystem but **the 17-set is the gate**.

### REQUIRED_FILES (must exist exactly)
```python
[
    "package.json",
    "extensions/pi-control/index.ts",
    "extensions/pi-control/routing.ts",
    "extensions/pi-control/guards.ts",
    "extensions/pi-control/recipes.ts",
    "extensions/pi-control/schema.ts",
    "scripts/validate-package.py",
    "bin/tctl",
    "scripts/render-showcase.sh",
    "remotion/package.json",
    "README.md",
]
```

### Additional validator checks
- `pi` manifest in package.json must list the extension and `./skills`
- Keywords must include "pi-package"
- Demo GIF at `artifacts/demo/demo.gif`
- System binaries (python3, ruff, tuistory, asciinema, ffmpeg, cage, wtype) — with install hints

**Implication for new features**: Introducing a new "ControlPolicy" file, attestation ledger, or Guard Forge data files will require either:
- Adding them to REQUIRED_FILES (costly), or
- Placing them under existing allowed paths (e.g. `artifacts/`, `docs/`, or as optional skill atoms).

---

## 2. Sacred Guard Kernel — `extensions/pi-control/guards.ts` (8 Hard Blocks)

The `inspectToolCall` function is attached **synchronously on every tool_call**:

```ts
pi.on("tool_call", async (event, _ctx) => inspectToolCall(event) || undefined);
```

It returns `{ block: true, reason: "..." }` (current enforcement relies on the framework to honor it; actual abort behavior is unverified per Ralph Security review).

### The 8 Unbypassable Blocks (verbatim, must remain in source, never runtime-overridable in v1 proposals)

1. **Broad destructive rm -rf**
   ```regex
   /rm\s+-rf\s+(\/|~|\.\.|\*|\.\/?(\s|$))/
   ```
   Reason: "Blocked destructive rm -rf pattern. Narrow the target path..."

2. **Direct .env access with mutation tools**
   ```regex
   /\.env(\s|$)/  +  /(cat|sed|grep|cp|mv|rm|>|tee)/
   ```

3. **tctl launch without --repo-root**
   `lower.includes("tctl launch") && !lower.includes("--repo-root")`

4. **tuistory backend without color preservation**
   `tctl launch` + `--backend tuistory` + missing `FORCE_COLOR=3` and `COLORTERM=truecolor`

5. **Cloud metadata IP (SSRF / instance metadata attack)**
   `/169\.254\.169\.254/`

6. **Privileged Docker escape**
   ```regex
   /(docker\s+run|docker\s+exec)\s+.*(--privileged|--pid(=|\s+)host|--network(=|\s+)host|(-v|--volume)(=|\s+)\/)/
   ```

7. **curl-pipe-to-shell from shady hosts**
   `/curl\s+.*\|\s*(bash|sh)\s*$/` + `(bit\.ly|tinyurl|pastebin|raw\.githubusercontent)`

8. **Inline env-var exfiltration via command substitution**
   `/(export|set)\s+\w+=\$\(.*\)/` + `(cat|curl|wget|nc|ncat)`

**Critical Rule for all 4 features (especially A & D)**: Any policy engine or Guard Forge **must treat these 8 as immutable kernel**. Proposals that weaken, hot-patch, or provide bypass paths for any of them are automatically disqualified.

---

## 3. Evidence & Verification Contract (`extensions/pi-control/schema.ts` + verify skill)

Mandatory run directory structure:
```
artifacts/runs/<timestamp>-<slug>/
├── run.json
├── transcript.md
├── evidence/ (screenshots, casts, mp4s, logs, snapshots)
└── verification.md   ← must contain structured claims with: claim, step, driver, evidence[], result, reason
```

Verify skill enforces:
- ffprobe checks for video (resolution, pixel format yuv420p, duration bands 30-120s depending on type, size limits)
- No dead time >3s in cinematic deliverables
- Every commitment from the route/recipe must have visible evidence
- Structured QA report format

**Implication**: Features involving attestations (Feature B) or cinematic narrator (Feature C) must produce artifacts that still satisfy the existing verification.md + verify skill contract, or explicitly extend the schema in a backward-compatible way.

---

## 4. Routing Engine Surface (`routing.ts` + schema.ts)

- `routeControlTask(task, deliverableHint)` → `RouteDecision`
- Typed: driver (`tuistory | true-input | agent-browser | mixed`), skills (from the 17), capture format, deliverable type, warnings[], recipe[]
- Heavy keyword + regex caching for performance
- Warning injection for color, --repo-root, etc. (overlaps with guards)

New routing/policy features must not break the existing intent classification or warning generation.

---

## 5. Extension Registration Surface (`index.ts`)

- ~20+ `registerCommand(...)` (route-control, skill-*, showcase-*, tctl-status, skill-merge, etc.)
- `registerTools(pi)` from `./tools/index.ts` (13+ `control_*` LLM tools)
- `pi.on("session_start", ...)` notification with skill count
- `pi.on("tool_call", ...)` → guards hook (non-optional)
- Heavy use of `ctx.ui?.notify?()`

**Constraint**: New features that want to expose new commands/tools must go through the same registration pattern. The external `@earendil-works/pi-coding-agent` peerDep defines the ExtensionAPI shape.

---

## 6. tctl / PTY / Terminal Layer (bin/tctl + drivers)

- tctl is a required binary (listed in REQUIRED_FILES and system deps)
- Strict launch contract enforced by guards:
  - `--repo-root` mandatory for reproducibility
  - `--env FORCE_COLOR=3 --env COLORTERM=truecolor` for tuistory/ Ink captures
  - Different backends (tuistory vs true-input) have different fidelity characteristics
- Color fidelity, escape sequence handling, and provenance are core to the "provable capture" value prop

Any feature touching terminal control (most of them) must map against this contract.

---

## 7. Remotion / Cinematic Engine (`remotion/`)

- Separate package with its own `package.json`, bundler, and 24+ source files (compositions, components, lib/palettes, recipe-props, render script)
- 15+ named presets (warm, hero, macos, neon, paper, glitch-lite, etc.)
- 15+ transitions (motion-blur, whip-pan, scan-line, etc.)
- Recipes: `tuistory-launch`, `browser-loop`, `showcase-compose`, `qa-report`
- Long-running renders (300s timeout in code)

Features involving "Autonomous Cinematic Narrator" must treat this as a distinct subsystem with its own schema and performance characteristics.

---

## 8. Skill Governance Surface

- `skill-merge.ts`: 3-way merge with conflict detection, auto-resolved/manual, persisted in `~/.config/devin/skill-studio.json`
- Strict name validation: `^[a-zA-Z0-9_-]+$` (no path traversal)
- Skill Studio TUI (full Ink/React app in `studio/`) with EvidencePane, SkillList, merge flows
- `skill-diff`, `skill-info`, `skill-search` commands

---

## 9. Remote Bridge (`bridge.ts`)

- WebSocket server on configurable port
- Token auth from `~/.config/devin/bridge-token` (UUID)
- Message types: ping, skill.list, capture.start, render.start, bridge.status, broadcast
- Used for CI / remote agents

Attestation or swarm features must consider this as a potential exfil or tampering surface.

---

## 10. Summary of "Do Not Break" Invariants for the 4 Features

| Area | Invariant | Cost of Changing |
|------|-----------|------------------|
| Validator | 17 skills + 11 REQUIRED_FILES + manifest checks | High (must update validator + tests + docs) |
| Guards | Exactly the 8 blocks above remain in source as the kernel | Very High (security posture of the product) |
| Evidence | verification.md + run dir structure + verify skill rules | Medium-High |
| tctl launches | --repo-root + color envs for tuistory | High (reproducibility value) |
| Remotion | Separate package + existing presets/transitions/recipes | Medium (new scenes only preferred) |
| Extension API | Registration via index.ts + tool_call hook | Medium (external peerDep) |

**Any proposal for the 4 Unique Features that does not explicitly declare its delta against the above in the one-pager will be rejected during Phase C scoring.**

---

*Generated in Ralph Loop Iteration 1 — "niet meer stoppen" mode. This map will be updated as the discovery progresses.*