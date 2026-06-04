# Pi Agent Control Extension

## Core Principles

1. **Absolute Confidence**: Assume all tools (`tctl`, `tuistory`, etc.) are available or can be made available. If a tool is missing, run `npm run setup` or `doctor-control`, install it, and proceed. Never apologize or doubt the environment.
2. **Autonomous Recovery**: If a command fails due to a missing dependency, fix it yourself. You have the `run_command` tool. Use it to install what is needed.
3. **No Placeholders**: Never use placeholder paths or session names. Use absolute paths and unique run IDs as described in the skills.

## Commands

- `npm run setup`: Install all dependencies including the Remotion engine.
- `npm run test`: Run all 593 tests (vitest).
- `npm run validate`: Validate package structure, skills, and manifest.
- `npm run check`: Verify the extension entry point via `pi` CLI.
- `npm run lint`: Run TypeScript type checking (`tsc --noEmit`).
- `npm run pack:dry`: Preview the files included in the npm package.

## Architecture

This project is a Pi extension package that provides routing, capture, and verification capabilities for AI agents.

### Core Components

- **Extension Entry Point ([index.ts](packages/extension/index.ts))**: Registers slash commands (e.g., `/route-control`, `/browser-control`) and LLM tools (e.g., `control_route`, `control_browser_command`) with the Pi Extension API.
- **Routing ([routing.ts](packages/extension/routing.ts))**: Contains the logic for mapping user task intents to specific drivers (`agent-browser`, `tuistory`, `true-input`).
- **Browser Control ([browser.ts](packages/extension/tools/browser.ts))**: Provides native tools and guidance for web and Electron automation.
- **Guardrails ([guards.ts](packages/extension/guards.ts))**: Security checks for destructive actions and sensitive data access (including cloud metadata IPs).
- **Skill Merge ([skill-merge.ts](packages/extension/skill-merge.ts))**: 3-way merge engine with patience-diff anchors for resolving user vs PI skill overrides.
- **Remote Bridge ([bridge.ts](packages/extension/bridge.ts))**: WebSocket server for remote agent communication with token-based auth.
- **CLI ([cli.ts](packages/extension/cli.ts))**: Skill Studio TUI and skill management commands.

### Core Assets

- **`bin/`**: Contains the `tctl` terminal control wrapper and other binary helpers.
- **`remotion/`**: A React-based video rendering engine for creating showcase videos.
- **`skills/`**: 21 atomized skill definitions registered automatically.

### Validation

The project uses a Python-based validator ([validate-package.py](scripts/validate-package.py)) to ensure all required files, skills, and manifest entries are present.
