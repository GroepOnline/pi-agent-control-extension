# Narrator-to-Showcase Integration Bridge (Current Gap)

**Date**: 2026-05-28 (this 10 door cycle)

## Summary

The narrator prototype (v0.1) successfully generates high-level, narrative-driven `showcase-props.json` files (with `preset`, `chapters`, `effects`, `overlays`, etc.).

The project's primary production render path (`scripts/render-showcase.sh` + `remotion/src/render.ts` → `renderShowcase` + `buildShowcasePropsFromRecipe`) expects a different, clip-staging-oriented props shape (pre-converted video clips staged into `public/`, plus a props structure containing a `clips` array with timing, paths, and fidelity metadata).

## Evidence from This Loop

- Multiple narrator props files generated from real proof bundles:
  - `real-improved-2026-05-28T07-00-46-props.json`
  - `real-2026-05-28T07-00-46-props.json`
  - `real-iter12-from-bin.props.json` (generated via the official `bin/control-narrate` in this door)

- Direct test in this door:
  - Ran `bin/control-narrate` on the real 2026-05-28T07-00-46 bundle (captured as `control-narrate-on-real-bundle-iter12.cast`).
  - Fed the resulting props into `scripts/render-showcase.sh --props <narrator-props> <some-clip>` (captured as `render-showcase-with-narrator-props-iter12.cast`).
  - Result: No video produced; the script expects clip assets and a compatible props schema.

## Architectural Gap

| Aspect                    | Narrator Prototype Output                  | render-showcase.sh Expectation                  |
|---------------------------|--------------------------------------------|-------------------------------------------------|
| Props shape               | High-level: preset, chapters, effects, overlays | Clip-oriented: clips[] array with paths, durations, fidelity |
| Input assets              | Pure verification + run.json + evidence   | Pre-staged video clips in public/ (from .cast via agg+ffmpeg) |
| Render entry              | Direct Remotion composition (Showcase with narrative data) | Staged clips + patched props → npx remotion render Showcase |
| Current compatibility     | Low (requires either new composition or props transformer) | High (this is the production path for most showcases) |

## Concrete Next Steps to Close the Gap

1. **Option A (Recommended for speed)**: Extend the narrator prototype with a "clip-staging mode" that also:
   - Extracts or references the actual terminal captures (.cast files) from the run.
   - Uses the existing conversion logic (agg + ffmpeg via render-showcase.sh patterns) to produce video clips.
   - Outputs props in the shape expected by `buildShowcasePropsFromRecipe` / render-showcase.sh.

2. **Option B**: Create a dedicated "NarratorShowcase" composition (or extend the existing one) that can directly consume the current high-level narrator props shape without requiring pre-staged clips.

3. **Option C (Hybrid)**: Make `control_narrate` / the narrator prototype detect the target render mode and produce the appropriate props shape + staging.

4. Wire the chosen path into `bin/control-narrate` so that a single invocation can go all the way to video output when possible.

## Value of Current Work

Even without full video output yet, the loop has produced:
- A working, tested narrator heuristic + prototype.
- A robust converter for real verification artifacts.
- An official CLI entrypoint (`bin/control-narrate`).
- An official skill skeleton (`skills/control-narrate`).
- Clear, reproducible documentation of the exact integration gap.

This positions Feature 4 extremely well for the next engineering step once the render compatibility layer is built.

All paths absolute. No placeholders. Kernel untouched.
*Loop continues.*