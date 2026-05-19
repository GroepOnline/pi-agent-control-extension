# Pi Agent Control Extension

## Commands

- `npm run setup`: Install all dependencies including the Remotion engine.
- `npm run validate`: Validate package structure, skills, and manifest.
- `npm run check`: Verify the extension entry point via `pi` CLI.
- `npm run lint`: Run TypeScript type checking.
- `npm run pack:dry`: Preview the files included in the npm package.

## Architecture

This project is a Pi extension package that provides routing, capture, and verification capabilities for AI agents.

### Core Components

- **Extension Entry Point ([index.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/index.ts))**: Registers slash commands (e.g., `/route-control`, `/browser-control`) and LLM tools (e.g., `control_route`, `control_browser_command`) with the Pi Extension API.
- **Routing ([routing.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/routing.ts))**: Contains the logic for mapping user task intents to specific drivers (`agent-browser`, `tuistory`, `true-input`).
- **Browser Control ([browser.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/tools/browser.ts))**: Provides native tools and guidance for web and Electron automation.
- **Guardrails ([guards.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/guards.ts))**: Security checks for destructive actions and sensitive data access (including cloud metadata IPs).

### Core Assets

- **`bin/`**: Contains the `tctl` terminal control wrapper and other binary helpers.
- **`remotion/`**: A React-based video rendering engine for creating showcase videos.
- **`skills/`**: 20 atomized skill definitions registered automatically.

### Validation

The project uses a Python-based validator ([validate-package.py](file:///home/jan/projects/pi-agent-control-extension/scripts/validate-package.py)) to ensure all required files, skills, and manifest entries are present.
