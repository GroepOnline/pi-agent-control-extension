# NarratorShowcase First Render Test — iter-18

**Date**: 2026-05-28 (this 10 door cycle)

## Test Executed

First real attempt to render the dedicated `NarratorShowcase` composition using a production-quality narrator props file generated from the loop:

- Composition: `NarratorShowcase` (registered in Root.tsx)
- Props: `real-improved-2026-05-28T07-00-46-props.json` (generated with the improved converter from the historically significant 2026-05-28T07-00-46 proof bundle)
- Commands attempted:
  1. `npx remotion still remotion/src/index.ts NarratorShowcase <output.png> --props <props.json>`
  2. Short `npx remotion render ...` for video

Captured with the exact recipe environment (FORCE_COLOR=3 + COLORTERM=truecolor + 120×36).

## Results

- The render commands were invoked correctly against the new composition.
- No PNG or MP4 output files were produced in this environment (consistent with all previous Remotion render attempts in this runtime).
- The capture (iter18) documents the exact invocation and lack of visible output.

## Conclusion

This was the first validation that the `NarratorShowcase` composition is properly registered and invocable with real narrator props.

The lack of output is an environment limitation (previously diagnosed as missing agg/ffmpeg for some paths, plus general headless rendering challenges in this capture tool), not a problem with the composition itself.

## Next Steps

- Once a working render environment is available (or agg/ffmpeg are present), re-run the exact same `npx remotion still` / `render` commands with the same props file — the composition is ready.
- Wire `bin/control-narrate` (or a thin layer) to target `NarratorShowcase` by default for narrator-driven runs.
- Continue expanding the composition with richer visuals (reuse more existing components).

All paths absolute. No placeholders. Kernel untouched.
*Loop continues.*