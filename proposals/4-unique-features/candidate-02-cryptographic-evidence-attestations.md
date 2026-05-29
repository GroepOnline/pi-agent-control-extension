# Unique Feature Candidate 02: Cryptographic Evidence Attestations + Ledger

**Status**: Draft — Continuation ("10 door" scheduled execution)  
**Based on**: Approved Ralph v2 plan (Feature B seed) + live analysis of current evidence system

---

## 1. Problem

The current evidence system is **structurally strong** but cryptographically weak:

- Every run produces `run.json`, `transcript.md`, `evidence/`, `verification.md`
- The `verify` skill does rigorous ffprobe, commitment, and content checks
- However, there is **no cryptographic proof** that:
  - The evidence bundle has not been tampered with after creation
  - The verification.md was actually produced by the verify process at that time
  - The artifacts are authentic and came from this specific agent run

This creates a trust gap for:
- Cross-org handoff
- Compliance / audit scenarios (the current branch is security-audit)
- Long-term archival of agent proofs
- Multi-agent or CI-triggered runs via the bridge

Anyone with filesystem access can edit verification.md or swap evidence files without detection.

---

## 2. Proposed Solution

Extend the existing evidence contract with **lightweight cryptographic attestations**:

- On successful verification, produce a detached signature (or embedded) over:
  - Hash of `verification.md`
  - Manifest of all files in `evidence/` (with their hashes)
  - `run.json` metadata (timestamps, task, driver, etc.)
- Use existing Node crypto (the project already imports `randomUUID` from `node:crypto` in bridge.ts)
- Support Ed25519 or similar (simple key management via existing Pi session keys or a project key)
- Optional append-only local ledger (simple JSON lines file or small SQLite) of attestation hashes

The `verify` skill (or a new `attest` step) becomes the point where the signature is created.

The native `pi-agent-control` binary can expose `verify --attest` or similar.

---

## 3. Uniqueness

Most agent "evidence" systems today are either:
- Raw screenshots + logs (easy to fake)
- Browser-use style traces without strong provenance

This would give Pi Agent Control a **provable, signed, tamper-evident evidence standard** that compounds the already-obsessive verify skill and strict run directory contract.

Very hard for competitors to match without building the entire evidence + verification + signing pipeline from scratch.

Ties beautifully into the security-audit branch work.

---

## 4. Delta vs External Contract Map (v5.1.4)

**Compatible with existing invariants**:
- Does **not** change the 8 sacred guard blocks
- Does **not** require new entries in `validate-package.py` REQUIRED_FILES (can live in `artifacts/` or as optional output of verify)
- Builds directly on `EVIDENCE_SCHEMA`, `verification.md` format, and the `verify` skill
- Can reuse the existing bridge token model or Pi session keys for signing identity

**New surface** (low-to-medium risk):
- Key management for signing (can start with simple local keypair + later integrate with Pi identity)
- New optional attestation file in the run directory (e.g. `attestation.sig` + `manifest.json`)

**Evidence amplification**: Massive. A signed attestation turns "we have a verification.md" into "here is cryptographic proof this verification happened at this time with these exact artifacts."

---

## 5. Agent Leverage

Agents can:
- After `/verify-control` or using the verify skill, request `--attest`
- Include the attestation in showcase videos or reports (e.g. embed the signature hash in the title card)
- Use the bridge to request remote attestations for CI runs
- Build higher-level trust systems (e.g. "only accept runs with valid attestations from known keys")

---

## 6. Implementation Sketch (for later)

- Add `attestEvidence(runDir, options)` in a new or extended module
- Extend the verify skill output format to optionally include attestation
- CLI: `pi-agent-control verify <task> --attest`
- Simple local ledger in `~/.config/pi-agent-control/attestations.log` (hash chain)
- Later: support for detached signatures + public key distribution

---

## 7. Risks & Mitigations (from Ralph reviewers)

- Key management / key compromise → Start with local keys + clear documentation; make signing optional in v1
- Performance overhead on every verify → Make it opt-in (`--attest`)
- Bridge as exfil path (noted in contract map) → Attestations can be local-first; remote broadcast is separate
- Complexity → Keep v1 extremely simple (hash + detached sig over the manifest)

---

*Produced during scheduled "10 door" execution — continuing the approved plan without stopping.*