# film/ — fixed example film (NOT the generic mechanism)

This directory holds **one finished marketing film**: `PiExtensionsFilm`
(Open, Stack, Wishcraft, Orchestrator, Tools, Missions, Control, Close)
plus `LiveTerminal`. The copy per scene is **intentionally hardcoded** —
it is a completed asset, not a template.

## The global showcase mechanism lives elsewhere

- **Generic composition:** `../compositions/Showcase.tsx` (+ `NarratorShowcase.tsx`)
  — fully props-driven (`showcaseSchema`): clips, title, subtitle, labels,
  preset, keys, sections, effects. Any content, any extension.
- **Skills:** `packages/skills/showcase` (visual polish/presets) and
  `packages/skills/compose` (capture → props → `render-showcase.sh` → verify).
- **This film** is registered as the `ExtensionsFilm` composition in `Root.tsx`
  purely as a pre-built example. Add new fixed films here; for anything
  dynamic, use the `Showcase` composition via the compose skill.

Proven 2026-09-13: `ExtensionsFilm` renders 1896 frames end-to-end, and the
generic `Showcase` renders arbitrary props + real clips (pi-warm chrome).
