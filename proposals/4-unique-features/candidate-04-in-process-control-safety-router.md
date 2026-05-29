# Unique Feature Candidate 04: In-Process Multi-Modal Control & Safety Router (Guards + Routing + tctl/PTY Mastery)

**Status**: Draft — "10 door" continuation (supporting autoresearch subagent)  
**Emerging from**: Codebase analysis + web research on Pi's in-process model + original Ralph seeds (routing + guards as core)

---

## 1. The Core Strength

This extension's most foundational unique capability is the **tight, in-process integration of intelligent multi-modal control with domain-specific safety**.

Key components working together:

- **guards.ts**: Real-time `tool_call` interception (in-process hook in index.ts) with 8 sophisticated, Pi-specific rules (rm -rf protection, .env blocks, cloud metadata IP 169.254.169.254, tctl color + --repo-root enforcement, privileged docker escapes, curl-pipe-sh from shady hosts, command-sub exfil, etc.).
- **routing.ts**: Sophisticated intent-based router that selects between `tuistory` (TUI fidelity), `true-input` (real terminal emulator key encoding), `agent-browser` (web/Electron), or `mixed`, while injecting warnings and recipes. Regex caching for performance.
- **tctl + PTY layer** (bin/tctl + drivers): High-fidelity, reproducible terminal automation with strict reproducibility requirements enforced by guards.
- **bridge.ts + native binary**: Remote control + rich local CLI surface.

This creates a "universal control router" that is deeply aware of the environments it controls and actively prevents the common failure modes of agent automation in those environments.

---

## 2. Why Unique / Defensible

- **In-process safety is rare and powerful**: Most agent systems (including Claude Code's hooks or external MCP tools) use out-of-process mechanisms. Pi's in-process TS extensions allow zero-overhead, stateful, context-aware interception (as highlighted in community comparisons like disler/pi-vs-claude-code).
- **Domain-specific rules at this depth**: The 8 guard rules are not generic "don't rm -rf". They are tailored to real Pi usage patterns (tctl sessions, tuistory color fidelity for evidence, cloud metadata protection, etc.). Replicating this requires deep domain knowledge of terminal automation + agent failure modes.
- **Multi-modal with fidelity guarantees**: Few systems offer first-class, high-fidelity control across real terminal emulators (true-input), TUI recorders (tuistory), and browser — with reproducibility and evidence capture baked in.
- **Vs browser-use**: Browser-Use is excellent for web but narrow. This is the broader "control plane" for coding agents that need terminal + desktop + browser in one coherent, safe, evidence-producing system.
- **Hard to replicate outside Pi's architecture**: The combination of in-process extensions + the specific tctl/PTY stack + the evidence contract makes this a platform-level differentiator.

---

## 3. Evidence from Codebase & Research

- Direct in-process hook: `pi.on("tool_call", ... => inspectToolCall(event))` in index.ts:344.
- 8 precise blocks in guards.ts (including the exact cloud metadata and tctl rules).
- Routing logic that understands "real terminal" vs "TUI snapshot" vs "web QA" and augments with skills/warnings.
- Strict enforcement in validate-package.py and the 17 skills.
- Web research confirms: Pi extensions' in-process model is repeatedly cited as the primary advantage over Claude Code's external hooks and other systems.
- ROADMAP shows ongoing investment in exactly this area (Background PTY, LLM Guardrails, Steadier tctl, Remote Tmux, Multi-Agent Swarm).

---

## 4. Leverage of Architecture & Contract

- Perfectly respects the External Contract Map (guards are sacred kernel; tctl rules are non-negotiable; evidence contract is the output format).
- Amplifies the verify skill (safe, reproducible runs produce better evidence).
- Enables the other candidates (safe control makes cinematic output and attestations more trustworthy).
- The native binary + bridge expose this control surface to agents and remote systems.

---

## 5. Security / Audit Amplification (Security-Audit Branch Relevance)

This is the heart of the security posture:
- Real-time blocking of high-risk patterns before they execute.
- Reproducibility guarantees (color, repo-root) that make evidence trustworthy.
- Cloud metadata protection (a classic SSRF vector).
- Extensible for future LLM-powered guardrails (as in ROADMAP).

A signed evidence bundle from a run that passed these guards is far more credible for audits.

---

## 6. Agent Leverage

Agents can reliably:
- Perform complex terminal + browser + desktop workflows with built-in safety.
- Get intelligent routing + warnings automatically.
- Produce auditable, reproducible evidence even for destructive or long-running tasks.
- Use the control surface via the native CLI or bridge without reinventing safety.

This turns "agent control" from a risky, brittle activity into a governed platform capability.

---

## 7. Implementation Notes / Gaps

- Already largely implemented — this candidate is mostly about surfacing, documenting, and productizing the existing power (plus the planned LLM guardrails and background PTY work).
- Opportunity: Expose more of the routing/guard decision process as observable events or tools for the agent itself (meta-control).

---

*Produced as part of the ongoing non-stopping autoresearch loop on the 4 unique features (10 door continuation). Supports the active subagent synthesis.*