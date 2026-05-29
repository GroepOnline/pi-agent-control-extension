# Live Evidence Addendum — iter-03 (this 10 door)

**Date**: 2026-05-28  
**Context**: Continuation of perpetual 10 door loop after iter-02 full tuistory recipe run + scoring + security pass.

## Captures performed this door (exact recipe env)

All captures used:
- `FORCE_COLOR=3`
- `COLORTERM=truecolor`
- `--cols 120 --rows 36`
- Proper repo-root context where relevant

### 1. remotion-surface-iter03.cast (Feature 4 — Autonomous Cinematic Narrator)
- Location: `proposals/4-unique-features/evidence/remotion-surface-iter03.cast`
- Content: Directory listing of `remotion/` + `remotion/src/` (presets, components, recipes).
- Value: Direct raw input surface for a future autonomous narrator. Shows the mature preset/effects structure that Feature 4 would consume and drive after verification.

### 2. skills-view-tuistory-iter03.cast (Feature 2 — Skill Governance + auditability)
- Location: `proposals/4-unique-features/evidence/skills-view-tuistory-iter03.cast` (9.6 KB)
- Command: `./bin/pi-agent-control skills view tuistory`
- Value: Loads and displays the original skill atom with its frontmatter name ("tuistory"). Maintains the audit trail of literal SKILL.md names under the exact color environment required by guards.ts:28-33.

### Partial from previous door (killed)
- `verify-on-prior-proof-iter02b.cast` + `.log` (very small, ~1KB): Long-running attempt to run `pi-agent-control verify` on the prior full proof run. Stalled after >9 minutes in headless mode. Task was terminated this door. Remains as record of attempting heavy verification output for Claim 3.

## Ties to the 4 Features

- **Feature 1 (Guardrails)**: All captures this door and previous continued to honor the exact tuistory color rule proven in iter-02 `guards.ts.txt:28-33`. No launches violated the guard.
- **Feature 2 (Skill Governance)**: The `skills-view-tuistory-iter03.cast` is fresh proof of the native CLI surface loading original atom names.
- **Feature 3 (Attestations)**: The partial verify attempt + the existing iter-02 RUN_DIR artifacts continue to build the raw material (verification outputs, structured evidence) that an attestation layer would sign.
- **Feature 4 (Cinematic Narrator)**: `remotion-surface-iter03.cast` gives the narrator a concrete view of the preset and source structure it would need to select from and annotate.

## Status

- No new deltas to External Contract Map or the 8 sacred blocks.
- Working capture method (asciinema + mandated env) remains reliable and fast for targeted surfaces.
- Evidence corpus continues to grow with every door.

**Next door candidates** (neutral):
- Consume the remotion surface + skills view casts into a small narrator sketch one-pager.
- Another full or focused recipe-style run targeting true-input or a mixed workflow.
- Expand the top-ranked Feature 1 one-pager with the accumulated guards + recipe enforcement evidence.

All artifacts use absolute paths and preserve original skill names where applicable.
*Loop continues.*