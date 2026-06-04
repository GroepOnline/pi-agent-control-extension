# Narrator Dedicated Composition (Option B) — First Skeleton

**Date**: 2026-05-28 (this 10 door cycle)

## Context

Environment limitation confirmed: `agg` and `ffmpeg` are not available in the current runtime. This blocks all `.cast → video` conversion paths (including the newly implemented logic in `narrator-clip-stager.cjs`).

As a direct result, we are executing **Option B** from the `narrator-to-showcase-bridge.md`: creating a dedicated Remotion composition that can consume the high-level narrator props the prototype already produces, without requiring pre-staged video clips or external conversion tools.

## Deliverables This Door

- `remotion/src/compositions/NarratorShowcase.tsx` — first skeleton of a dedicated composition.
- `remotion/src/schema/narrator.schema.ts` — minimal Zod schema for the narrator props shape.
- Updated `remotion/src/Root.tsx` — registers the new composition as `id="NarratorShowcase"`.

The composition reuses the existing palette and component system where possible and accepts the exact props shape the current `generate-props.cjs` + `control-narrate.cjs` already emit (preset, chapters, effects, durationTargetSec, runId, etc.).

## Benefits of This Path

- Allows actual rendering (still or video) in the current environment.
- Bypasses the entire clip-staging / agg+ffmpeg requirement.
- Gives the narrator a clean, first-class composition target (`NarratorShowcase`) instead of forcing it into the clip-oriented `Showcase` composition.
- Can still reuse many existing components (TitleCard, WindowChrome, Keystrokes, Effects, etc.) for rapid visual quality.

## Next Steps (Recommended)

1. Flesh out `NarratorShowcase.tsx` with real chapter rendering, effects application, title cards, and provenance overlays using the existing component library.
2. Add a simple `calculateMetadata` or duration calculation specific to the narrator props.
3. Test rendering with `npx remotion still` or `npx remotion render` using one of the real narrator props files (e.g. `real-improved-2026-05-28T07-00-46-props.json`).
4. Once the composition produces good output, wire `bin/control-narrate` (or a new thin layer) to call the render directly with `NarratorShowcase`.
5. Consider keeping the clip-stager path as Option A for environments where agg + ffmpeg are available (more efficient for very long terminal captures).

## Relation to Previous Work

This is the practical continuation of the work documented in:
- `narrator-to-showcase-bridge.md`
- `narrator-progress-iter10.md`
- Multiple render test captures (iter09–iter15)

It directly addresses the environment blocker while advancing Feature 4 toward usable cinematic output.

All paths absolute. No placeholders. Kernel untouched.
*Loop continues.*