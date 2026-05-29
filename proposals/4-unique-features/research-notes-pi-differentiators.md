# Research Notes: Pi Agent Control Extension Differentiators (Autoresearch Synthesis)

**Date**: 2026-05-28 (during persistent "niet meer stoppen" / "10 door" / "15m" loop)
**Purpose**: Supporting research for the 4 Unique Features proposal. Synthesized from web searches, codebase analysis, and prior contract map / candidates.

## Core Pi Ecosystem Strengths (from disler/pi-vs-claude-code, qualisero/awesome-pi-agent, earendil-works/pi docs)

**Philosophy**:
- Pi: Minimal core + maximum extensibility. "If I don’t need it, it won’t be built." Trusts frontier models. User builds exactly what they want via skills + extensions.
- Claude Code: Batteries-included, safe-by-default, heavy guardrails, sub-agents/teams out of the box.
- Result: Pi wins for power users who want to *build platforms/harnesses*; Claude wins for "just works" polish.

**Technical Differentiators** (huge for the control-extension):
1. **In-Process Execution** (biggest edge):
   - Extensions run in the *same Node/Bun process* as the agent loop.
   - Direct access to full session state, event bus, TUI primitives.
   - Zero RPC/serialization overhead.
   - Can intercept/modify *any* event in real time (especially `tool_call` for guards, before/after agent steps, input, etc.).
   - Contrast: Claude Code uses external shell hooks (PreToolUse etc. — JSON over stdin/stdout, subprocesses) and MCP (external JSON-RPC). Higher latency, less power for complex logic or live UI.

2. **Extensions API Power**:
   - One TS/JS module can:
     - Register custom LLM tools (with schemas, streaming, custom renderers).
     - Add slash commands / hotkeys.
     - Inject rich UI (dialogs, confirmations, live widgets, status lines, custom TUI components).
     - Persist state.
     - Handle dynamic models/providers.
     - Full event bus communication.
   - Hot-reload with `/reload`.
   - Stackable (multiple extensions via `-e` or auto-discovery).
   - Examples in ecosystem: damage-control (real-time tool interception + YAML rules for dangerous bash), pi-control (self-control tools), pi-subagents, custom dashboards.

3. **Skills System**:
   - Self-contained Markdown packages (`SKILL.md` with frontmatter: name, description, instructions + optional scripts/assets).
   - Progressive disclosure: description in prompt, full content loaded on demand.
   - Auto-discovered across locations; compatible with ~/.claude/skills etc.
   - Agent itself can generate them.
   - Creates a rich, shareable ecosystem (badlogic/pi-skills has browser, APIs, etc.).

4. **Control & Safety Primitives** (directly relevant to this extension):
   - Real-time tool_call interception (exactly what guards.ts does in this project).
   - Domain-specific safety (cloud metadata IP blocking, tctl color enforcement, .env protection, privileged docker, curl-pipe-sh — all in guards.ts).
   - Agent self-control (tools to resume, switch models, navigate history, fork sessions, etc.).
   - Sub-agents with parallel execution, live UI widgets, steering, custom types.
   - Git checkpointing, compaction control, doom-loop detection.

**Performance & Flexibility**:
- Fast cold starts.
- Any model/provider (20+ , local/self-hosted first-class).
- MIT, community-driven.
- Can build entire custom harnesses, safety layers, multi-agent orchestration, GUI overlays, etc.
- Hedge against proprietary tools by building your own platform on top.

## Specific to pi-agent-control-extension (from codebase + history)

This extension is a prime example of Pi's extensibility in action:
- **Guards as real-time damage control** (in-process tool_call hook with 8 sophisticated, domain-specific blocks).
- **Intelligent multi-driver routing** (tuistory for TUI fidelity, true-input for real terminal emulators, agent-browser for web/Electron, mixed for chained workflows). Includes warning injection for reproducibility (color envs, --repo-root).
- **Evidence-first contract** + obsessive verify skill (run dirs, verification.md with claim/step/driver/evidence/result/reason, ffprobe + commitment + no-dead-time checks).
- **Native control binary** (`bin/pi-agent-control`) exposing rich skills governance CLI (list --json, view, validate, diff, merge, enable/disable) + integration with Ink-based Skill Studio TUI.
- **Cinematic output** via tightly integrated Remotion (presets, effects, transitions, verification-driven pacing, render pipeline).
- **tctl + PTY mastery** for reproducible, color-faithful terminal automation (enforced by guards).
- **Remote bridge** for CI/remote agent triggering.
- **Skill atomization + governance** (17+ expected skills, 3-way merge with shadow states, strict validator).

**Comparisons**:
- **Vs Browser-Use**: Browser-Use is excellent, focused, benchmarked web automation (Playwright + semantic refs, cloud stealth/scaling). Pi control-extension is the *broader control harness*: full coding + terminal (tctl/tuistory/true-input with high fidelity) + macOS AX desktop control + multiple browser backends (AX, CDP, agent-browser wrappers) + evidence/verification + cinematic output + safety gates, all in one extensible in-process system. Complementary in some setups (agent-browser can route to Browser-Use cloud).
- **Vs standard Claude Code / Cursor**: Pi (via this extension and the ecosystem) offers deeper programmatic control, lower overhead for complex logic, real in-process safety (vs external hooks), unified terminal + GUI + browser + desktop in persistent sessions, and the ability to build custom platforms rather than using a fixed tool.
- **Evidence/audit angle** (security-audit branch relevance): The combination of guards + evidence contract + verify + (future) attestations gives provable, auditable runs that most other agents lack.

## Implications for the 4 Unique Features

This research strongly supports and refines the existing candidates:
- Candidate 01 (Skill Governance CLI + TUI + merge/shadow) is a direct manifestation of Pi's skills + extensions philosophy made concrete and native.
- Candidate 02 (Cryptographic Evidence Attestations) directly amplifies the already-unique evidence/verification system.
- Candidate 03 (Autonomous Cinematic Narrator) leverages the sophisticated Remotion integration that few (if any) other agents have at this depth.
- Strong 4th candidate emerging: **In-Process Real-Time Control & Safety Primitives** (the guards + routing + tctl enforcement + bridge as a "universal control router" with domain-specific intelligence and reproducibility guarantees). This is hard to replicate outside Pi's in-process model.

Additional potential 4th or cross-cutting: The "Native Multi-Modal Control Hub" (one binary + TUI + skills system that unifies terminal, browser, desktop, evidence, cinematic output, and remote control with first-class governance and safety).

**Gaps / Opportunities noted**:
- The extension is a great showcase of Pi's strengths but depends on the broader Pi runtime (in-process model is the foundation).
- Some advanced features (full AX desktop, certain tctl behaviors) are platform-specific (strong on macOS/Linux terminal fidelity).
- Documentation and "why this is different" could be stronger for marketing the uniqueness.

## Sources
- disler/pi-vs-claude-code (COMPARISON.md and related)
- earendil-works/pi docs (extensions.md)
- qualisero/awesome-pi-agent
- badlogic/pi-skills and related
- injaneity/pi-computer-use and browser-tools
- Direct codebase analysis (guards.ts, routing.ts, schema.ts, verify skill, compose/showcase, bin/pi-agent-control, remotion, etc.)
- Previous contract map and candidate drafts in this proposals/ folder.

This research feed is ready for the autoresearch subagent to synthesize the final 4-unique-features proposal.