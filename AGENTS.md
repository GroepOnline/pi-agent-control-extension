# Pi Agent Control Extension

## Commands

- `npm run validate`: Validate package structure, skills, and manifest.
- `npm run check`: Verify the extension entry point and model loading via `pi` CLI.
- `npm run pack:dry`: Preview the files included in the npm package.
- `python3 scripts/validate-package.py`: Run the validation script directly.

## Architecture

This project is a Pi extension package that provides routing, capture, and verification capabilities for AI agents.

### Core Components

- **Extension Entry Point ([index.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/index.ts))**: Registers slash commands (e.g., `/route-control`, `/doctor-control`) and LLM tools (e.g., `control_route`, `control_doctor`) with the Pi Extension API.
- **Routing ([routing.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/routing.ts))**: Contains the logic for mapping user task intents to specific drivers (`agent-browser`, `tuistory`, `true-input`), capture formats, and workflow recipes.
- **Recipes & Verification ([recipes.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/recipes.ts))**: Provides canonical templates for common workflows and logic to verify that evidence reports meet required standards.
- **Guardrails ([guards.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/guards.ts))**: Inspects tool calls to prevent unsafe operations (e.g., broad deletions, sensitive file access).
- **Schema ([schema.ts](file:///home/jan/projects/pi-agent-control-extension/extensions/pi-control/schema.ts))**: Defines the `EVIDENCE_SCHEMA` and the list of expected skill atoms.

### Skills

The `skills/` directory contains atomized skill definitions. Each subdirectory contains a `SKILL.md` file that describes the skill's purpose, requirements, and process. These skills are automatically registered by the extension.

### Validation

The project uses a Python-based validator ([validate-package.py](file:///home/jan/projects/pi-agent-control-extension/scripts/validate-package.py)) to ensure all required files, skills, and manifest entries are present and correctly configured.
