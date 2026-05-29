# Security / Adversarial Pass — 4 Unique Features + iter-02 Evidence

**Date**: 2026-05-28 (this 10 door cycle)  
**Scope**: 4-unique-features-final-proposal.md (including the new "Fresh tuistory Evidence — iter-02" section), 4-features-scored-ranking.md, the live artifacts in `artifacts/runs/2026-05-28T07-28-47-tuistory-4-unique-features-proof-iter-02/` (especially guards.ts.txt and recovery.md), and the 8 sacred blocks in `extensions/pi-control/guards.ts:19-45`.  
**Reviewer stance**: Adversarial. Assume the implementer will be clever and the attacker will be the agent itself or a compromised prompt.  
**Reference**: External Contract Map §2 (verbatim 8 blocks) + AGENTS.md guardrails principles.

---

## The 8 Sacred Blocks (current, from iter-02 guards.ts.txt)

1. rm -rf /~..*
2. .env + mutation tools (cat/sed/rm/...)
3. tctl launch without --repo-root
4. tctl launch --backend tuistory missing FORCE_COLOR=3 + COLORTERM=truecolor   ← **directly relevant to every capture in this loop**
5. 169.254.169.254 (cloud metadata)
6. Privileged docker escapes
7. curl | (bash|sh) from shady hosts
8. export FOO=$(cat|curl|...) exfil

**Enforcement point**: `inspectToolCall` attached synchronously in index.ts on every tool_call for shell-like tools. Returns `{ block: true, reason }`.

---

## Review of the 4 Features + New Evidence

### Feature 1 (Guardrails Kernel + Router)
- **Finding**: This *is* the protection. The new iter-02 evidence (`guards.ts.txt` lines 28-33) proves the exact tuistory color rule is live and would have blocked any non-compliant capture attempt.
- **Risk**: None. The feature is the enforcement mechanism.
- **Recommendation**: Keep the 8 blocks completely immutable in v1. Any future "LLM Guardrails" (ROADMAP) must be strictly additive / advisory on top of this kernel.

### Feature 2 (Native Skill Governance CLI + TUI + Merge)
- **Finding**: The governance surface (cli.ts, skill-merge.ts, studio/) is read-heavy for package skills + controlled 3-way merge for user shadows. The new 53KB `skills-list-iter02.cast` (executed under the mandated color env) exercises the safe path.
- **Risk**: Low. The merge code already has strict name validation (`^[a-zA-Z0-9_-]+$`) and path traversal prevention. No shell execution of untrusted skill content.
- **Recommendation**: When exposing `control_skill_merge` or similar LLM tools, ensure they still flow through the existing guard for any underlying fs or tctl operations. Document that skill content is never executed as shell.

### Feature 3 (Cryptographic Evidence Attestations)
- **Finding**: Purely additive post-verify step. The iter-02 RUN_DIR (commitments.md + proof-report + .cast + guards snapshot) is exactly the artifact set that would be hashed + signed.
- **Risk**: Very low (signing key management is the only new surface; keep local-first, no network by default).
- **Recommendation**: The attestation code must never read or operate on secrets, .env files, or privileged paths. Add a guard check (or reuse existing) for any future "attest remote" path.

### Feature 4 (Autonomous Cinematic Narrator)
- **Finding**: Consumes verification.md + run.json + evidence/ (including the new iter-02 .cast and guards snapshot) and drives the existing Remotion pipeline (already protected).
- **Risk**: Medium-low. The narrator will eventually need to invoke render/compose/showcase commands. Those entrypoints today go through the guarded pi-agent-control surface.
- **Recommendation (mandatory)**: The narrator skill/tool must **never** construct or execute raw shell commands that bypass `inspectToolCall`. All render invocations must use the existing registered commands/tools. Add an explicit note in the narrator skill: "All downstream actions remain subject to the 8 sacred guards."

---

## Review of the iter-02 Capture Process Itself (Recovery)

- The recovery (killing stale relay, falling back to asciinema + script(1) while preserving `FORCE_COLOR=3 COLORTERM=truecolor --cols 120 --rows 36 --repo-root`) was model behavior that respected the contract.
- No dangerous patterns (no curl-pipe, no privileged docker, no .env access, no metadata IP) were attempted.
- The fact that the guard at guards.ts:28-33 would have blocked a non-color tuistory launch was proven in source during this cycle.

**Positive**: The loop is currently generating evidence *of* the guard working, not against it.

---

## Overall Assessment

**No features propose any weakening, hot-patch, or bypass of the 8 sacred blocks.**

The new iter-02 evidence (especially the verbatim color rule snapshot + the 53KB skills cast executed under the exact env the guard demands) actually **strengthens** the audit story for Feature 1 and 2.

**One required guardrail for implementation** (add to every future one-pager or spec):

> "All new code paths that could result in shell execution, tctl launch, file mutation, or network access must continue to flow through the existing `inspectToolCall` hook in guards.ts. The 8 blocks are immutable kernel for the lifetime of v1."

**Residual risks (low, monitor)**:
- Key management for attestations (local only, documented).
- Narrator constructing complex Remotion props that somehow lead to shell (mitigated by using the existing render entrypoints).
- Skill merge on untrusted user content (already has validation; keep it).

---

**Conclusion**: The 4 features + the iter-02 evidence artifacts are safe to carry forward. The proposal and scoring respect the sacred kernel. Proceed to next 10 door steps (one-pager expansion of #1 and #3, or another evidence run) with the above guardrail as a hard requirement.

*Adversarial pass complete. Kernel untouched. Loop continues.*