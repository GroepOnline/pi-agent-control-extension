# Autoresearch Synthesis: Raw Research Notes for 4 Unique Features
**Project**: Pi Agent Control Extension (workspace: /home/jan/OrgChefgroep/pi-agent-control-extension)
**Date**: 2026-05-27/28 (security-audit / v5.1.4 branch context, Ralph "niet meer stoppen" / "10 door" loop)
**Mission**: Identify exactly 4 unique high-value features via deep autoresearch (code, contracts, external comparisons).

## Key Inputs Consumed
- External Contract Map (proposals/4-unique-features/external-contract-map.md): 17 exact skills (agent-browser, capture, compose, pi-agent-cli, pi-agent-control, pty-capture, showcase, true-input, tuistory, verify, init, wiki, review, autoresearch, session-navigation, background-pty, meta-control); 8 sacred immutable guard blocks in guards.ts; strict evidence run dir + verification.md + verify skill (ffprobe, no dead time >3s, commitments); tctl --repo-root + color envs; Remotion separate pkg + 12+ presets/15+ transitions; routing engine; extension registration in index.ts; skill-merge 3-way + studio TUI; bridge WS.
- 4 Candidate Drafts (including emerging 04): 
  1. Native Skill Atom Lifecycle Governance (cli.ts + skill-merge.ts + studio/ Ink TUI + shadow states + enable/disable/validate/diff/merge + JSON surface).
  2. Cryptographic Evidence Attestations + Ledger (builds on EVIDENCE_SCHEMA, run dirs, verify skill; add sigs/hashes/ledger post-verify).
  3. Autonomous Cinematic Narrator (agent-directed compose/showcase/Remotion pipeline with auto preset/effects/sections from verification.md + run.json).
  4. In-Process Multi-Modal Control & Safety Router / Real-Time Guardrails (guards.ts + routing.ts + capture.ts + tctl/PTY drivers + bin/ + bridge as "universal control router" with domain-specific intelligence).
- Competitive / Differentiator Notes (research-notes-pi-differentiators.md + competitive-research-log.md + web searches):
  - Pi core: In-process extensions (same Node process, zero-overhead tool_call interception on event bus, full state/UI injection, hot-reload, unified registerCommand/registerTool). Major differentiator vs Claude Code (external PreToolUse hooks + MCP JSON-RPC subprocesses) and Cursor etc.
  - Vs browser-use (Python lib): Excellent narrow web (Playwright + semantic DOM refs, domain restrictions, sensitive data masking, custom Controller for pre-exec validation, Chromium sandbox). Pi is the *broader full control harness*: terminal (high-fidelity tctl/tuistory/true-input with color/escape provenance + reproducibility), browser (multiple backends), desktop (macOS AX etc.), evidence/verification contract, cinematic Remotion output, native governance CLI/TUI/binary, all unified with in-process safety. Complementary possible (agent-browser can integrate Browser-Use cloud).
  - CUA (Anthropic Computer Use): Model classifiers + refusals for destructive (rm -rf etc.) but bypassable via indirect prompt injection (obfuscated in screenshots/PDFs). Relies on user Docker/VM sandboxing. No in-process framework-level regex guards for control-specific risks (tctl contracts, tuistory fidelity, cloud metadata 169.254.169.254, docker escapes, curl-pipe specific). Warnings sometimes disabled in sandboxes.
  - Guardrails comparison: browser-use/CUA mostly opt-in Python/VM or model-level. Pi guards: synchronous in-process, 8 unbypassable (in source) domain-specific blocks tailored to agent-control failure modes + evidence fidelity.
  - Skill systems elsewhere: Flat files/RAG/prompt dirs. Rare native CLI + TUI + 3-way git-aware merge + shadow tracking + strict 17-atom validator lock + disable state.
  - Evidence: Most "screenshots + logs". Pi: structured run dirs + verification.md + obsessive verify (technical + commitment + content/no-dead-time) + (future) crypto.
  - Cinematic: Almost non-existent in agent tooling. Pi has mature Remotion (presets like pi-warm/pi-hero, effects, keystroke overlays, code annotations, verification-tied pacing, recipes).
- Codebase Deep Dives (key files read/grepped):
  - extensions/pi-control/index.ts: 20+ registerCommand (route-control, skill-*, showcase-*, tctl-status, skill-merge, bridge-*, preset-list etc.), registerTools (13+ control_* LLM tools), pi.on("tool_call", inspectToolCall), pi.on("session_start"), Control Hub guidance, formatters for route/doctor/usage/browser.
  - guards.ts (full): inspectToolCall on shell tools; exactly 8 blocks: rm -rf broad, .env + mutation, tctl no --repo-root, tuistory no FORCE_COLOR=3/COLORTERM=truecolor, 169.254.169.254, privileged docker, curl | sh from bit.ly etc., export= $(cat/curl) exfil. Benchmarks + 20+ unit tests.
  - routing.ts: 12+ ROUTE_RULES (browser/web -> agent-browser + screenshots; real terminal/escape -> true-input + pty-capture; tui/ink/cli -> tuistory + capture; video/showcase -> showcase/compose/verify; qa -> verify; etc.). Regex cache, warnings injection (color, repo-root), buildRecipe with driver-specific steps + deliverable. renderRoute. Full test coverage.
  - capture.ts: Unified facade, routeToDriver -> delegates to browser.ts / tuistory.ts / true-input.ts, evidence dir creation, validateEvidence, format result. Ties routing to drivers.
  - schema.ts: Exactly 17 SKILL_NAMES (matches validator), RouteDecision type (driver 4 options, skills, capture 4, deliverable 4, warnings, recipe), EVIDENCE_SCHEMA (run.json/transcript/evidence/verification.md with claim/step/driver/evidence/result/reason JSON).
  - skill-merge.ts: 3-way merge (git merge-base aware or fallback), conflict detection with markers, MergeState persisted ~/.config/devin/skill-studio.json, resolve --pi/--user/--manual, strict name validation.
  - cli.ts (skills subcmd via bin/pi-agent-control): buildRegistry with PI vs user dirs (~/.agents ~/.devin ~/.claude), shadowState (shadowed/overrides), enabled from disabled set, valid (frontmatter checks), mtime; commands: list [--json][--source], view, enable/disable, validate, diff, merge, help. Rich ANSI output.
  - studio/ (full Ink/React TUI): app.tsx + panes (SkillList, SkillDetail, EvidencePane, ActionBar, StatusBar), hooks (useSkillRegistry, useFilter), model/skill.ts; merge/override/diff flows, evidence viewing.
  - tools/index.ts: 13+ tools (control_route, control_recipe, control_evidence_schema, control_skill_index, control_doctor, control_verify_commitments, control_usage, control_parallel_verify, control_browser_guidance, control_os_guidance, browserCommandTool, control_telemetry).
  - tuistory.ts / true-input.ts / browser.ts: Driver-specific tctl launch strings (strict --repo-root + color for tuistory), command construction for formats (cast/mp4/png/report).
  - skills/verify/SKILL.md: Obsessive: ffprobe (res 1920x1080, yuv420p, size<5MB/25MB, duration bands 30-120s per type), commitment mapping (title card, effects, keystrokes visible), no dead time >3s, before/after, structured QA/pass-fail + evidence paths. Failure loops back.
  - skills/pi-agent-control/SKILL.md: Detailed orchestrator: 3 routing dims (target/stage/artifact), tctl ONLY for recorded (never direct tuistory), RUN_ID isolation for concurrent, delegation patterns to workers with absolute paths, prerequisites per driver (tuistory: tuistory+asciinema+agg; true-input platform-specific cage/wtype/VMs; agent-browser; compose: ffmpeg etc.), layout defaults (single vs side-by-side).
  - remotion/: Separate package; src/schema/showcase.schema.ts (zod: 12 presets incl pi-warm/pi-hero, 16 transitions, effects {zoom/spotlight/callout/keystroke etc.}, keys, sections, codeAnnotations, fidelity, layouts); lib/recipe-props.ts (auto per recipe: tuistory-launch=dark-pro/scan-line, browser-loop=macos/motion-blur, etc.); components (TitleCard, Keystrokes, EffectLayer, TransitionLayer, CodeAnnotations, etc.); render.ts + scripts/render-showcase.sh integration; 300s timeout.
  - bin/pi-agent-control (bash): dispatches demo/verify/qa/doctor (validator), skills (to cli.ts).
  - bin/skill-studio: launches studio/index.tsx via tsx.
  - scripts/validate-package.py: Rigid gate - exactly EXPECTED_SKILLS 17-set, REQUIRED_FILES (incl guards.ts, routing.ts, schema.ts, bin/tctl, remotion/package.json etc.), pi manifest checks, keyword "pi-package", demo.gif, system deps (with non-CI fatal).
  - bridge.ts: WS server (port 8765 default), UUID token ~/.config/devin/bridge-token, msgs: ping/skill.list/capture.start/render.start/bridge.status/broadcast; for CI/remote.
  - Other: recipes.ts (canonical strings + verifyCommitments checker), telemetry, e2e tests, coverage.
- Package/Architecture: "pi-package" + "pi-extension"; peer @earendil-works/pi-coding-agent; files include extensions/skills/bin/remotion/scripts; Control Hub pattern (route -> capture (auto driver) -> verify -> qa/showcase).
- External Context Cross-Checks: In-process = power for guards/routing (confirmed in Pi community). browser-use/CUA lack equivalent depth in terminal fidelity + evidence + cinematic + native governance. Guards + verify = audit amplification on security branch.

## Validated/Refined 4 Features (Final Selection)
1. **Native Skill Atom Lifecycle Governance** (refined from cand 01): Confirmed via cli.ts (full subcmd surface + JSON + shadow/enabled/valid), skill-merge (git 3way + state), studio TUI (full panes + hooks), validator lock on 17, integration with evidence.
2. **Cryptographic Evidence Attestations + Ledger** (cand 02): Builds directly on schema/EVIDENCE_SCHEMA + run dirs + verify (ffprobe/commitments). Gap: no sigs today; opportunity post-verify in native binary/bridge. Compatible (optional artifacts in artifacts/runs/).
3. **Autonomous Cinematic Narrator** (cand 03): Leverages mature Remotion (rich schema/presets/effects/transitions/recipe-props), compose/showcase skills, tight verify tie-in (duration, commitments visible). Current: manual; feature = auto from verification.md/run.json.
4. **In-Process Real-Time Control & Safety Router (Guards + Routing + tctl/PTY Mastery)** (cand 04 + research): Core differentiator. guards.ts sacred kernel + in-process hook (index.ts); routing 12 rules + capture facade + 4 drivers (with fidelity contracts); pervasive tctl enforcement. Vs competitors: unique depth + in-process zero-overhead.

## Cross-Verification & Uniqueness Summary
- **Code invariants respected**: All 4 declare deltas vs contract map (none break 8 guards, 17 skills, evidence contract, tctl rules, Remotion pkg). Low packaging tax.
- **Security/audit**: Guards protect fidelity (color/repro for evidence); skill governance makes decision atoms auditable; evidence + (future) attestations + cinematic (with embedded proofs) = provable runs. Security-audit branch synergy.
- **Agent leverage**: Programmatic (JSON CLIs/tools), safe execution, reproducible proofs, polished outputs, self-governance.
- **Gaps noted** (honest): Crypto/attestations and full narrator are forward (v1 opt-in/simple); some platform specifics (true-input VMs); depends on Pi in-process runtime (the foundation of uniqueness); docs for "why different" could improve.
- **No other strong 5th**: Telemetry/bridge/usage are supporting; "native hub" is cross-cutting synthesis of 4.

## Sources for Further
- All listed files + tests (guards.test.ts 20+ cases, routing.test.ts comprehensive, skill-merge.test.ts).
- Web: browser-use GitHub (Controller/custom guards), Anthropic CUA docs + HiddenLayer injection research, Pi community comparisons (disler etc.).
- Artifacts: evidence/ (skills-list.json shows real shadows), runs/ in artifacts/, coverage/.

This raw synthesis (consolidated from pi-differentiators.md, candidate drafts, contract, direct code reads/greps, external searches) feeds the polished 4-unique-features-final-proposal.md. All claims cross-checked against source and external data. "niet meer stoppen" complete for Phase B/C.