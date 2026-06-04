# 4 Features — Forced Ranking & Scoring (Post iter-02)

**Date**: 2026-05-28 (this 10 door cycle)  
**Inputs**: 4-unique-features-final-proposal.md (v with fresh iter-02 evidence), ROADMAP-deconflict.md, External Contract Map, live artifacts from `artifacts/runs/2026-05-28T07-28-47-tuistory-4-unique-features-proof-iter-02/` (guards.ts.txt, skills-list-iter02.cast 53KB, proof-report, recovery.md), guards.ts:19-45 (the 8 sacred blocks), competitive research log.  
**Method**: Forced ranking after de-biasing gate. Scores 1-5 (5 = best for this project). Criteria chosen to match Ralph v2 plan + security-audit branch priorities. No seed bias from early candidates.

**New evidence boost (iter-02)**: The tuistory recipe run (with exact color env + recovery) materially increased Evidence Strength for Claims 1 and 2 (live guards color rule + 17+ atom names in .cast under the mandated env). Claim 3/4 substrate also improved.

---

## Scoring Matrix

| Rank | Feature | Buildability (1-5) | Uniqueness vs competitors (1-5) | Security Surface Delta vs 8 Sacred Guards (1-5) | ROADMAP Synergy (Q3/Q4 2026/2027) (1-5) | Evidence Strength (post iter-02) (1-5) | Total | Short Rationale |
|------|---------|--------------------|----------------------------------|--------------------------------------------------|-----------------------------------------|---------------------------------------|-------|-----------------|
| 1 | **1. Synchronous In-Process Guardrails Kernel + Universal Router** | 5 | 5 | 5 (the kernel *is* the protection) | 5 (direct foundation for LLM Guardrails + Background PTY) | 5 (guards.ts:28-33 color rule + recipe enforcement proven in iter-02; routing + tctl contracts live) | 25 | The table-stakes safety layer. Already production (8 blocks + routing + tests + doctor). New iter-02 evidence directly proves the exact tuistory color rule the recipe uses. Highest leverage and lowest risk. |
| 2 | **2. Native Skill Atom Lifecycle Governance (Skill Forge)** | 4 | 4 | 4 (read-heavy + validated merge paths; low mutation surface) | 4 (critical as Background PTY / Swarm / new skills proliferate) | 5 (53KB skills-list-iter02.cast with literal original names + doctor + studio TUI attempt under color env) | 21 | Mature native CLI + Ink TUI + 3-way merge + 17-atom validator. The new .cast is strong live proof of the governance surface + color fidelity. Unique "first-class asset" treatment of SKILL.md. |
| 3 | **3. Cryptographic Evidence Attestations + Ledger** | 4 (thin additive layer on existing verify) | 4 (no competitor has signed bundles on top of structured verification.md + ffprobe) | 4 (additive; can only strengthen the existing contract) | 5 (essential for 2027+ remote tmux / swarm handoff + compliance) | 4 (excellent substrate from every tuistory run + iter-02 RUN_DIR itself; no implementation yet) | 21 | High-ROI, low-code. The obsessive evidence contract (run dirs, verification.md, commitments) already exists and was exercised again in iter-02. Signing is the natural next multiplier. |
| 4 | **4. Autonomous Cinematic Narrator** | 3 (requires heuristics/LLM on top of mature Remotion) | 3 (rare in agent tooling; browser-use/CUA have raw video or manual) | 3 (consumes evidence; no direct mutation of guards) | 5 (perfect consumer of Q4 high-fidelity capture + Remotion upgrades) | 4 (Remotion pipeline + recipes mature; iter-02 .cast + guards snapshot are ideal narrator inputs; prior cinematic runs exist) | 18 | Highest visibility / marketing value once the others are solid. iter-02 explicitly calls out the .cast and safety evidence as narrator food. Still needs the "autonomous editorial" layer. |

**Scoring notes**:
- Buildability weights current implementation maturity + contract safety (no REQUIRED_FILES changes, no weakening of the 8 blocks).
- Security Delta is **positive** only if the feature strengthens or is strictly additive to the 8 sacred blocks (guards.ts:19-45). Anything that risks hot-patching or bypassing them scores low (none did).
- Evidence Strength updated live from the just-completed iter-02 tuistory recipe (new .cast under exact env, guards rule snapshot, self-contained proof-report with PASS).
- ROADMAP scores pulled directly from ROADMAP-deconflict.md (Feature 1 underpins three items; Feature 4 is the editorial layer on Q4 capture work).

---

## Forced Final Ranking (recommended Phase C order)

1. **Feature 1 — Guardrails Kernel + Router** (do first, already the foundation)
2. **Feature 3 — Cryptographic Attestations** (low cost, immediate trust multiplier on existing evidence runs)
3. **Feature 4 — Autonomous Cinematic Narrator** (high visibility once 1+3 are live)
4. **Feature 2 — Skill Governance** (mature; scale it as the catalog grows with roadmap items)

**Rationale for order**: Feature 1 is the non-negotiable safety substrate (and the thing that makes tuistory captures trustworthy). Attestations (3) turn every future verified run into something that can survive handoff or audit. Narrator (4) makes the whole story visible to stakeholders. Governance (2) is already strong and becomes more valuable as more skills (Background PTY, swarm, etc.) are added.

---

## Security Surface Summary (cross-ref to iter-02 + guards.ts)

All four features were re-checked against the 8 sacred blocks during this door (see guards.ts.txt from iter-02 and the full 8 in External Contract Map §2).

- No feature proposes runtime mutation, hot-patching, or bypass of any block.
- Feature 1 *is* the enforcement of the blocks (including the exact tuistory color rule used in every capture).
- Features 2-4 are consumers or additive layers on the protected evidence pipeline.
- iter-02 recovery explicitly states "0 changes to any sacred file."

**Recommended guardrail for any future implementation**: Every new command/tool that touches tctl, skills, verify, or Remotion must pass through the existing `inspectToolCall` hook with no exceptions.

---

**Handoff for next 10 door**: This ranking + the updated final-proposal (with live iter-02 evidence) are ready for a full adversarial + security pass (next todo) or one-pager expansion of the top two. All paths absolute. No placeholders.

*Persistent loop execution. Continue through.*