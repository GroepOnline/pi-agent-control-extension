# Architecture Decision Record: 2026-06-04 Restructure

## Context and Problem Statement

The `pi-agent-control-extension` package has grown organically, resulting in a flat and somewhat cluttered structure under `packages/extension/`. Domain logic (routing, capturing, verification, evidence generation) is mixed with tool definitions, driver-specific details (Playwright, PTY, TUI), and the Pi extension registration entry point.

To improve testability, make the package easy to extend, reduce bloat, and prepare for orchestrator/swarm workflows, we are refactoring to a clean, layered architecture under `src/`.

## Proposed Architecture

We are moving from a flat `packages/extension/` layout to a structured layered layout under `src/`:

```
src/
├── core/                      # Pure domain logic (completely free of Pi-specific imports/side-effects)
│   ├── routing/               # Intents mapping to drivers
│   ├── capture/               # Core capturing orchestration
│   ├── verify/                # Verification recipes and guards
│   ├── evidence/              # Structured artifact & proof generation
│   └── types/                 # Shared domain types & schemas
├── drivers/                   # Concrete target integrations
│   ├── terminal/              # tctl and PTY/tuistory integration
│   ├── browser/               # Playwright/agent-browser integration
│   └── desktop/               # OS and future GUI automation
├── extension/                 # Pi-specific entrypoint and registration wrapper
│   ├── tools/                 # Registered LLM tools
│   ├── events/                # Hook registrations
│   └── index.ts               # Extension entrypoint
├── skill/                     # Skill definition and merging logic
└── showcase/                  # Presentation rendering (narrator/Remotion integration)
```

## Consequences

- **Better Testability**: Pure domain logic in `src/core/` can be unit tested without mocking extension contexts.
- **Clear Separation of Concerns**: Extensions, drivers, core business logic, and presentation logic are decoupled.
- **Thin Entrypoints**: Entrypoints in `bin/` and `packages/extension/index.ts` become thin adapters delegating directly to the clean `src/` modules.
