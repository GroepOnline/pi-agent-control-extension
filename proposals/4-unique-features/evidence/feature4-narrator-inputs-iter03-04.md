# Feature 4 — Autonomous Cinematic Narrator Inputs (iter-03 / iter-04)

**Date**: 2026-05-28 (this 10 door cycle)  
**Focus**: Concrete raw material available inside the Remotion subsystem that an autonomous narrator (post-verify) could read, select from, and drive.

## Relevant Captures (all under exact recipe env)

- `remotion-surface-iter03.cast` (iter-03 door)
  - Command: `ls -la remotion/ && ls -1 remotion/src/`
  - Shows top-level structure: `public/`, `remotion.config.ts`, `scripts/`, `src/`, `tsconfig.json`
  - `src/` contains the core engine (presets, transitions, effects, recipes, components).

- `remotion-presets-recipes-iter04.cast` (this door)
  - Deeper look: `ls remotion/src/presets` + sample content from preset .ts files + confirmation of `remotion/src/recipes.ts`
  - Provides direct visibility into the 12+ named presets the narrator would choose between (pi-warm, pi-hero, macos, neon, dark-pro, presentation, minimal, paper, ocean, glitch-lite, etc.).

## Why This Matters for Feature 4

The Autonomous Cinematic Narrator's job (per the final proposal) is to:
1. Read `verification.md` + `run.json` + evidence manifest from a successful verify.
2. Decide preset, effects tier, key moments, chapters, overlays, and annotations.
3. Emit `showcase-props.json`.
4. Invoke the existing Remotion render pipeline.

The files surfaced in these two captures are exactly the decision space the narrator must navigate intelligently:
- Preset catalog (in `remotion/src/presets/`)
- Recipe definitions (in `remotion/src/recipes.ts` and related)
- Transition/effect libraries
- Branding and layout components

Having fresh, color-preserving terminal captures of this structure (produced under the same env rules the guard kernel enforces) gives us reproducible, auditable "before" material that any future narrator implementation can be tested against.

## Connection to Other Features

- **Feature 1 (Guardrails)**: All these captures were performed while strictly obeying the tuistory color + repo-root rules proven in iter-02 `guards.ts.txt:28-33`. The narrator will inherit the same protection when it eventually invokes render/compose paths.
- **Feature 2 (Skill Governance)**: The narrator itself will likely become a new skill atom or extension of `compose` / `showcase`. The governance surface (already exercised in the skills-view-tuistory-iter03.cast) will be how agents discover and version it.
- **Feature 3 (Attestations)**: These Remotion source captures, together with the verification artifacts from prior tuistory runs, become part of the signed evidence bundle. A narrator run can embed hashes or references to the exact preset versions used.

## Current State (as of this door)

We now have multiple independent, recipe-compliant terminal captures that document the Remotion input surface:
- Directory structure
- Preset listing
- Sample preset source
- Recipes file presence

This is sufficient raw material to begin sketching a minimal narrator heuristic (rule-based preset selection based on verification claim types + duration + driver) in a future door without touching the sacred 8 guard blocks or the 11 REQUIRED_FILES contract.

**Next natural step for a subsequent door**: Small one-pager or sketch for a `control_narrate` tool / skill that consumes a verified run dir and emits a props file + render invocation, while staying inside the existing guard + routing + evidence pipeline.

All paths absolute. No placeholders.
*Loop continues.*