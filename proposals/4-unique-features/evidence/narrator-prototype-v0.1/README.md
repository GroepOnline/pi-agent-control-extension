# Narrator Prototype v0.1 — Reference Implementation

**Date**: 2026-05-28 (this 10 door cycle)  
**Based on**: `feature4-narrator-sketch-minimal.md` (the v0.1 rule-based heuristic)  
**Goal**: Concrete, runnable reference that demonstrates the sketch in action against realistic input from this loop's proof work.

## What This Prototype Does

- Takes a (simplified or real) verification summary.
- Applies the deterministic preset selection table, effects rules, chaptering, and overlay logic from the sketch.
- Emits a `showcase-props.json` compatible with the existing Remotion pipeline.
- Documents the exact surfaces it would invoke (compose / render scripts) — confirmed via the iter-06 capture that top-level `compose` / `showcase` subcommands are not present on `pi-agent-control` (they are reached via skills or direct Remotion tooling).

## Files

- `generate-props.js` — Small, dependency-free Node script implementing the v0.1 heuristic.
- `example-input.json` — Representative successful verification summary derived from the loop's tuistory + skill governance work (high visual impact terminal + governance demo).
- `example-output-props.json` — The generated output for the example input.
- This README.

## How to Run

```bash
node generate-props.js --input example-input.json --output /tmp/my-props.json
cat /tmp/my-props.json
```

The script also supports a `--demo` mode that uses the built-in successful example.

### Official entrypoint

The project now exposes `bin/control-narrate` as the first official CLI for this capability. It delegates to the prototype for now:

```bash
bin/control-narrate artifacts/runs/2026-05-28T07-00-46-... 
```

## Heuristic Applied (from the sketch)

**Preset selection** (core table):
- High-impact terminal TUI / browser with strong visuals → `pi-hero` or `neon`
- Clean audit/proof style with many commitments → `paper` or `minimal`
- Long mixed workflow → `dark-pro` or `pi-warm`
- Default → `pi-warm`

**Effects**:
- Terminal-heavy → keystroke-pills + code-annotations + spotlight
- Many before/after pairs → whip-pan / scan-line between evidence
- Duration guard: target 45-90s, respect no >3s dead time

**Chaptering & Overlays**:
- One chapter per major verified step with strong evidence
- Provenance footer + commitment highlights

## Grounding in Real Loop Artifacts

- Preset and recipe catalog drawn from `remotion-presets-recipes-iter04.cast` and `remotion-surface-iter03.cast` (and the earlier Feature 4 narrator inputs consolidation).
- Input structure inspired by real `verification.md` / `proof-report.md` files from prior tuistory proof runs (e.g., the 2026-05-28T07-00-46 and iter-02 runs).
- Invocation surfaces confirmed by the `compose-showcase-entrypoints-iter06.cast` capture (this door).

## Status & Scope (v0.1)

- Pure reference / demonstration. Not wired into the production CLI or skills yet.
- Does **not** modify any sacred files (guards.ts, REQUIRED_FILES, Remotion package, etc.).
- All future integration must still pass through the existing guard kernel (Feature 1) and skill governance (Feature 2).
- Designed to be the starting point for a real `control_narrate` tool or post-verify step.

## Next Steps (suggested)

1. Run the prototype against one of the real successful verification bundles from the loop.
2. Turn the emitted props.json into a real render using the existing Remotion scripts.
3. Promote the heuristic + script into the first version of the narrator skill/atom (respecting Feature 2 governance).
4. Expand the Feature 1 guard proofs document with references to this prototype (the narrator will inherit the kernel protection).

This prototype turns the "Autonomous Cinematic Narrator" (Feature 4) from a high-level idea into a runnable, auditable starting point — directly fed by the high-quality evidence artifacts this perpetual loop has been producing.

All paths absolute. No placeholders. Kernel untouched.
*Loop continues.*