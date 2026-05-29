# Feature 4 — Minimal Narrator Sketch (Rule-Based v0.1)

**Date**: 2026-05-28 (this 10 door cycle)  
**Status**: Lightweight sketch. Purely additive on top of the existing Remotion pipeline, verify skill, and guard kernel. No changes to sacred 8 blocks or 11 REQUIRED_FILES.

## Goal

After a successful `verify` pass, automatically produce a stakeholder-ready cinematic artifact by:
1. Reading `verification.md` + `run.json` + evidence manifest.
2. Applying simple deterministic rules to choose preset, transitions, effects, and overlays.
3. Emitting `showcase-props.json`.
4. Invoking the existing `compose` / render pipeline.

## Inputs (already produced by current system)

- `verification.md` (structured claims with `step`, `driver`, `evidence[]`, `result`, durations, technical checks).
- `run.json` (task, target, primary driver, timestamps, dimensions).
- Recent remotion source captures (e.g. `remotion-presets-recipes-iter04.cast` and `remotion-surface-iter03.cast`) — these give the narrator the live catalog of available presets and recipes.

## Minimal Rule-Based Heuristic (v0.1)

**Preset selection** (primary decision):

| Condition                              | Chosen Preset     | Rationale (from recent captures) |
|----------------------------------------|-------------------|----------------------------------|
| High-impact terminal TUI or browser demo, strong visual claims | `pi-hero` or `neon` | High visual density, motion-blur + keystroke overlays shine |
| Clean audit / proof report style, many verification commitments | `paper` or `minimal` | Emphasizes text, claims, and evidence without distraction |
| Long mixed workflow (multiple drivers, >90s) | `dark-pro` or `pi-warm` | Good for chaptering and sustained narrative |
| Default / unknown                      | `pi-warm`         | Safe, branded, works for most cases |

**Effects & Transitions** (secondary):

- If terminal-heavy claims → enable `keystroke-pills`, `code-annotations` (if code visible), `spotlight`.
- If many before/after pairs → use `whip-pan` or `scan-line` transitions between evidence pairs.
- Duration target: keep total 45–90s (narrator trims or speeds non-critical sections to avoid dead time >3s per verify contract).

**Chaptering**:
- One chapter per major `step` in verification.md that has strong evidence.
- Title cards pulled from claim text + driver (e.g. "tuistory capture – 14s").

**Overlays**:
- Always show small provenance footer (run ID, commit, date) — reuses existing title-card components.
- Highlight failed/passed commitments from verification.md.

## Output

- `showcase-props.json` (or equivalent) compatible with the current Remotion render scripts.
- Direct call to existing `compose` or `showcase` entrypoint (already guarded by the kernel).

## Integration Points (no new sacred surface)

- Triggered via new thin skill/tool `control_narrate` (or extension of `compose`).
- Runs only after successful verify (enforced by the evidence contract).
- All render work goes through the existing Remotion package + guard-protected CLI surface.
- The narrator itself can be versioned as a normal skill atom (Feature 2 governance applies).

## Evidence Already Available (from this loop)

- `remotion-presets-recipes-iter04.cast` + `remotion-surface-iter03.cast`: concrete listing of presets and recipes the heuristic can select from.
- `feature4-narrator-inputs-iter03-04.md`: earlier consolidation of the same material.
- Multiple prior tuistory proof runs with full `verification.md` examples (iter-02 RUN_DIR and earlier).
- Guard enforcement proofs (the color + repo-root rules that any narrator-driven tctl launches will still obey).

## Risks & Mitigations (minimal)

- Over-polish on internal work → add `--style` flag (hero | clean | audit) controlled by the caller.
- Bad preset choice on weird runs → start conservative (always allow human override of the generated props.json).
- Render time → reuse existing timeout and background patterns already in the system.

## Next Concrete Steps (suggested for future doors)

1. Implement a tiny reference script (outside the sacred package) that reads a verified run dir and emits a props file using the table above.
2. Wire it as an optional post-verify step in one of the existing compose recipes.
3. Test against one of the real iter-02 / iter-03 proof runs.
4. Turn the reference script into the first version of the `control_narrate` tool/skill.

This sketch gives the Autonomous Cinematic Narrator (Feature 4) a clear, low-risk starting point that directly leverages the high-quality Remotion material and verification artifacts already produced by the loop.

All paths absolute. No placeholders. Kernel untouched.
*Loop continues.*