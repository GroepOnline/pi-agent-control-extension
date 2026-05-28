# v5.1 - Enhanced Control Layer

## Features
- Usage & Observability (/usage) - Real-time token tracking and cost estimation via the /usage command and control_usage tool. Provides visibility into resource consumption for better monitoring and budget management.
- Enhanced Guardrails - Improved secret detection and protections against destructive actions. Helps prevent accidental exposure of sensitive data and unintended harmful operations.
- Control Hub - New /control-hub endpoint that improves composability with other extensions. Enables better integration and coordination across different tools and workflows.
- Targeted Parallel QA - New /parallel-qa endpoint for focused verification and capture workflows. Allows efficient parallel testing of specific components or features.

# v5.1.1 - Skill Studio, Remotion Effects & Comprehensive Tests

## Skill Studio TUI

- Interactive terminal dashboard (`bin/skill-studio`) with 3-pane layout (LIST, DETAIL, ACTIONS)
- File watching with auto-reload on skill directory changes
- Persistent disabled state in `~/.config/devin/skill-studio.json`
- Search highlighting with yellow background for filtered matches
- Toast notifications, scroll indicators, focus cycling via Tab
- Keybindings: j/k nav, g/G jump, x toggle, o override, d diff, v validate, r reload, / filter, ? help, q quit

## Remotion Showcase

- 16 transition styles: motion-blur, flash, whip-pan, light-leak, glitch-lite, scan-line, vignette, grain, chromatic, ripple, pixelate, blur-zoom, split, radial-wipe, slide, mosaic
- 8 effect types in EffectLayer: zoom, shake, pulse, border, plus fade-in/out, spotlight, callout
- 12 color presets: warm, pi-warm, warm-hero, pi-hero, hero, macOS, presentation, minimal, dark-pro, neon, paper, ocean
- Modular component architecture (10 components)

## CLI Commands

- `/skill-studio` - Launch the Skill Studio TUI
- `/recipe-list` - List available recipes
- `/evidence-new` - Generate evidence run directory
- `/tctl-status` - Show active tctl sessions
- `/skill-diff <name>` - Diff user vs PI skill version
- `/skill-search <query>` - Search skills by name/description
- `/skill-info <name>` - Show detailed skill info
- `/preset-list` - List Remotion color presets
- `/transition-list` - List Remotion transition styles

## Tests

- 148 tests passing across 20 test files
- Studio component tests with ink-testing-library
- App integration tests with stdin key simulation
- Hook tests for useSkillRegistry and useFilter
- E2E flow tests: route → browser → evidence
- Coverage: 99.1% statements, 97.0% branches

# v5.1.2 - Evidence Capture Orchestrator & Remotion Render Pipeline

## Evidence Capture Orchestrator
- Unified `/capture <target> [--format mp4|cast|png|report]` command
- Auto-routing: URL → agent-browser, TUI → tuistory, else → true-input
- Automatic evidence validation against schema
- Driver modules: browser.ts, tuistory.ts, true-input.ts
- Results viewable in Skill Studio TUI evidence pane (key: `e`)

## Remotion Video Render Pipeline
- Programmatic `renderShowcase()` API in `remotion/src/render.ts`
- `buildShowcasePropsFromRecipe()` auto-selects preset/layout/transition per recipe
- CLI script: `remotion/scripts/render-showcase.ts`
- New commands: `/showcase-preview <recipe>`, `/showcase-render <recipe>`
- Recipe binding: capture path passed as clip source
- `remotion.config.ts` with concurrency=4 and output paths
- GitHub Action: `.github/workflows/showcase-render.yml` (manual dispatch)
- npm script: `npm run showcase:render`

## Tests
- 177 tests passing across 23 test files
- capture.test.ts: 16 tests for args parsing, routing, drivers, validation
- render.test.ts: 6 tests for recipe-to-props mapping
- EvidencePane.test.tsx: 3 tests for empty state, details, warnings

# v5.1.3 - Skill Merge System & Remote Agent Bridge

## Skill Override / Merge System (Optie C)
- 3-way merge engine in `skill-merge.ts` with LCS-based diff
- `/skill-merge <name>` — auto-merge user skill with PI version
- Conflict detection with line-level context markers (`<<<<<<< PI`, `=======`, `>>>>>>> USER`)
- `/merge-list` — view all recorded merge states
- Resolution helpers: `--pi`, `--user`, `--manual`
- Persistent merge state in `~/.config/devin/skill-studio.json`
- Auto-detect: warns when PI skill is updated after last merge
- TUI integration: key `m` triggers merge on selected skill

## Remote Agent Protocol (Optie F)
- WebSocket bridge in `bridge.ts` for remote agent communication
- `/bridge-start [--port 8765]` — start MCP-style WebSocket server
- `/bridge-status` — show connected clients, uptime, events
- Token-based auth stored in `~/.config/devin/bridge-token`
- Protocol message types: `ping`, `skill.list`, `capture.start`, `render.start`, `bridge.status`, `bridge.broadcast`
- Broadcast events to all connected clients
- Heartbeat ping every 30s with automatic client cleanup

## Tests
- 182 tests passing across 25 test files
- skill-merge.test.ts: merge state, conflict detection, resolve paths
- bridge.test.ts: bridge state, status markdown formatting

# v5.1.4 - Security Hardening & Test Expansion

## Security Fixes
- **bridge.ts**: Added `socket.on("error")` handler to prevent memory leaks on unclean disconnects; `httpServer.on("error")` now resets `bridgeState` and closes `wss`/`httpServer` so the bridge can restart after a port conflict
- **capture.ts**: `mkdirSync` wrapped in `try/catch` for best-effort resilience against permission errors
- **skill-merge.ts**: Added `isValidSkillName()` regex guard (`^[a-zA-Z0-9_-]+$`) against path traversal (`../`, absolute paths) in `mergeSkill`, `resolveMerge`, and `checkSkillUpdateConflict`
- **index.ts**: Skill-merge handler validates name before processing; `showcaseRender` rejects path traversal in `capturePath` and `outPath`
- **schema.ts**: Evidence schema now mentions `png` so `validateEvidence()` accepts the `png` format

## Test Expansion
- **203 tests** passing across **25 test files** (+19 new tests)
- `skill-merge.test.ts`: 6 `threeWayMerge` logic tests (clean merge, auto-resolve PI/user, conflict markers, different lengths, empty files) + 3 path traversal rejection tests
- `e2e-flow.test.ts`: 7 end-to-end tests for Capture → Evidence → Validation flow
- `index.test.ts`: 3 path traversal tests for `showcaseRender`

Prepared by Code Legend 🔥