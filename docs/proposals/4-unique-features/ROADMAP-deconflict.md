# ROADMAP Deconfliction for the 4 Unique Features

**Date**: 2026-05-28 (10 door iteration post-autoresearch synthesis)  
**Source**: 4-unique-features-final-proposal.md + ROADMAP.md

## Summary
All 4 features are **highly aligned** with the Q3 2026 / Q4 2026 / 2027+ roadmap items. None conflict; most are direct enablers or natural extensions.

### Feature 1: Synchronous In-Process Domain-Specific Guardrails Kernel (Real-Time Damage Control + Universal Control Router)
**Direct overlap / extension**:
- **Q3 2026: LLM-Powered Guardrails** — This is the explicit next evolution of Feature 1. The current static 8-block kernel in `guards.ts` is the perfect substrate for lightweight semantic analysis / policy engine. Feature 1 already provides the in-process interception hook, the sacred domain-specific blocks (tctl fidelity, cloud metadata, etc.), and the warning injection from routing. LLM-powered rules would sit on top without replacing the kernel.
- **Q3 2026: Background PTY Sessions + Steadier Orchestration Engine (Q4)** — Feature 1's routing + guards already enforce the exact reproducibility contracts (FORCE_COLOR, COLORTERM, --repo-root) that make background PTY and tctl hardening valuable. The "Universal Control Router" naturally extends to detached sessions and multi-agent swarm coordination.
- **2027+: Remote Tmux Orchestration + Multi-Agent Swarm Skills** — The in-process guard + routing layer is the safety and orchestration foundation for remote PTY and swarm scenarios.

**Status**: Feature 1 is the **foundational prerequisite** for three of the five Q3/Q4 items. Implementation of LLM Guardrails can start immediately on top of the existing kernel.

### Feature 2: Native Skill Atom Lifecycle Governance (Skill Forge)
**Indirect but strong alignment**:
- Skills governance (merge, shadow awareness, validation) becomes even more critical as Background PTY, Advanced Computer Use, and Swarm Skills proliferate. Knowing exactly which version of `background-pty`, `meta-control`, or a new OS-control skill is active during a verified run is audit gold.
- No direct conflict with any roadmap item. The 17-atom validator + native CLI/TUI/merge surface is mature and can absorb new skills without changes to the core contract.

**Status**: Pure enabler. Future roadmap skills will benefit from (and should be required to participate in) the existing governance surface.

### Feature 3: Cryptographic Evidence Attestations + Ledger
**Strong alignment with audit / distributed future**:
- **2027+: Remote Tmux + Multi-Agent Swarm** — Signed evidence bundles + ledger become essential for cross-machine, cross-agent, or CI-triggered runs. A remote tmux session or swarm refactoring run needs tamper-evident proof that can survive handoff.
- **Q3/Q4 Capture & Quality work** — Higher-fidelity recordings and 4K Remotion output increase the value of cryptographic attestation (larger artifacts = higher tampering incentive).
- Directly supports the security-audit branch goals.

**Status**: High-ROI addition that makes the entire roadmap more credible for production/audited use. Can be implemented as an optional `--attest` flag on verify/compose paths.

### Feature 4: Autonomous Cinematic Narrator (Verification-Driven Remotion Storytelling)
**Direct overlap with Q4 2026 Enhanced Capture & Quality**:
- **High-Fidelity Screen Recording (60fps, 4K, lossless via optimized Remotion)** — Feature 4 is the perfect consumer and driver of these improvements. The narrator already chooses presets, effects, and pacing based on verification commitments; higher-fidelity input will produce dramatically better output.
- **Q3 2026 Advanced Computer Use + Background PTY** — More complex workflows (OS-level actions, long-running detached sessions) create richer stories that benefit enormously from automated chaptering, proof highlighting, and stakeholder-ready cinema.
- The existing Remotion pipeline (12+ presets, 16 transitions, effects, codeAnnotations, strict verify tie-in) is already the foundation. The narrator is the "autonomous editorial layer" on top.

**Status**: Natural evolution. The narrator can immediately take advantage of higher-fidelity recordings and will make the new Computer Use / Swarm capabilities visible and marketable.

## Overall Assessment
- **Zero conflicts**. Every roadmap item either extends one of the 4 features or is made more powerful/valuable by them.
- **Compounding effect**: The four features together create a flywheel (safe routed runs → trustworthy evidence → attested → narrated cinema) that makes the entire 2026–2027 roadmap more defensible and customer-visible.
- **Security-audit branch alignment**: Features 1 and 3 are particularly high-value for the current branch (real-time damage control + tamper-evident proof).
- **Recommended prioritization** (for Phase C / implementation planning):
  1. LLM-Powered Guardrails on top of Feature 1 (direct Q3 item + amplifies everything).
  2. Cryptographic Attestations (Feature 3) — low cost, high trust multiplier, enables remote/swarm future.
  3. Autonomous Narrator (Feature 4) — leverages existing Remotion maturity and upcoming fidelity upgrades.
  4. Background PTY / Advanced Computer Use integration into the routing + evidence contract (extends Feature 1 + 4).

All proposed work in this document respects the External Contract Map and can be implemented without breaking existing invariants.

**Next**: Use this deconfliction as input to one-pager scoring or implementation sketches in Phase C.
