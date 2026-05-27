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
- 12 color presets: warm, pi-warm, warm-hero, pi-hero, hero, macos, presentation, minimal, dark-pro, neon, paper, ocean
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

Prepared by Code Legend 🔥