# v4 — Pi Extension-First Rebuild

This version changes the Pi target from a skills/prompts-only package into a first-class Pi extension package.

## Why

Pi skills are good for model instructions, but the original droid-control package is operational: it needs commands, routing, capture guards, evidence schemas, install checks, prompt generation, and deterministic tool recipes. Those belong in a Pi extension.

## Major changes

- Added `extensions/pi-control/` as the primary runtime integration.
- Added project-local `.pi/extensions/pi-control/index.ts` wrapper for hot-reload with `/reload`.
- Added custom commands: `/control`, `/route-control`, `/demo-control`, `/verify-control`, `/qa-control`, `/doctor-control`, `/skills-control`.
- Added custom tools: `control_route`, `control_recipe`, `control_evidence_schema`, `control_skill_index`, `control_doctor`, `control_verify_commitments`.
- Added guardrails around unsafe or malformed capture commands.
- Preserved all 10 original skill atoms as Pi skills under `skills/` and `.agents/skills/`.
- Kept prompts as reusable command templates rather than the main integration surface.
