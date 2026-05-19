---
name: wiki
description: Generate comprehensive codebase documentation. Read a repository and produce interconnected markdown documentation pages explaining what the code does and how it fits together. Use when asked to document a codebase, generate wiki pages, create architecture docs, or explain a project structure.
---
# Wiki generation

Read a repository, then produce interconnected documentation pages explaining what the code does and how it fits together. Output is a `docs/wiki/` directory of markdown files.

## 1. Survey the repository

Build a mental model before writing.

### Pass 1: Structural scan

Read (when they exist):
- `README.md`, `AGENTS.md`, `CONTRIBUTING.md` — project intent and conventions
- `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml` — dependencies and scripts
- `docs/` directory — existing documentation
- Entry points (`src/index.ts`, `main.go`, `app.py`, etc.)
- CI/CD config (`.github/workflows/`, etc.)
- Build tool config (`vite.config.*`, `Makefile`, etc.)
- Directory listing of project root and key subdirectories

Build a map of:
- What the project does (1-2 sentences)
- Major subsystems and how they connect
- Key data flows
- External dependencies (databases, APIs, services)
- Build and test commands

### Pass 2: Deep code scan

The structural scan finds what's visible from directory names. The deep scan finds what's only visible in code:
- Grep for feature flag names — each flag often represents a distinct capability
- Scan frontend route definitions — each route group is a user-facing feature
- Scan API endpoint groups — each controller/router file represents a domain
- Look in `src/features/`, `src/modules/`, `src/domains/` — names reveal product capabilities
- Scan service classes, event handlers, job/worker definitions — background systems

### Exhaustive subsystem discovery

Walk every top-level source directory. For each:

- **Tier 1** — core subsystems most contributors encounter. Full dedicated page.
- **Tier 2** — important but specialized. Shorter dedicated page.
- **Tier 3** — niche or thin wrapper. Paragraph in "Other subsystems" page.

Also check for commonly overlooked areas: custom lint rules, automation workflows, CLI/dev tools, test infrastructure, multi-language components.

## 2. Plan the table of contents

### Always-present pages

```
docs/wiki/
├── overview/
│   ├── index.md              — project overview, what it does, who uses it, quick links
│   ├── architecture.md       — system architecture with Mermaid diagrams
│   ├── getting-started.md    — prerequisites, install, build, test, run
│   └── glossary.md           — project-specific terms
├── by-the-numbers.md         — codebase statistics (lines, activity, complexity)
├── lore.md                   — timeline and history of the codebase
└── how-to-contribute/
    ├── index.md              — work pickup, PR process, review expectations
    ├── development-workflow.md — branch, code, test, PR, merge cycle
    ├── testing.md            — frameworks, patterns, how to run
    ├── debugging.md          — logs, common errors, troubleshooting
    ├── patterns-and-conventions.md — error handling, coding style
    └── tooling.md            — build system, linters, code generators
```

### Organizational lenses

Pick one primary lens as the main domain pages section (in sidebar), then optionally reference other lenses:

| Lens | When to use | Example |
|---|---|---|
| Features | User-facing or business capabilities | Search, Notifications, Billing |
| Services | Service-oriented / microservices | api-gateway, auth-service, worker |
| Apps | Monorepo with independent apps | web, mobile, admin, cli |
| Packages | Library monorepo or heavy SDK use | core, plugins, ui-kit |
| Systems | Backend with distinct technical systems | database, caching, queue, auth |

### Conditional sections

Include these when the codebase warrants:

- `migrations/` — database migration guidelines and known pitfalls
- `cleanup-opportunities/` — known tech debt, dead code, improvement areas
- `reference/` — external API docs, spec links, vendor docs
- `processes/` — non-coding workflows: releases, incident response, on-call
- `maintainers.md` — who owns what, how to contact

## 3. Write the pages

### General rules

- Use Mermaid for diagrams (`graph TD`, `sequenceDiagram`, `classDiagram`, `xychart-beta`). Do NOT use pie charts.
- Be specific: "The auth service issues JWT tokens with 15-minute expiry" > "The auth service handles authentication."
- Use concrete examples from the actual codebase.
- Link between pages aggressively — docs should be connected.
- Keep pages focused — under 400 lines each.
- Include code snippets with backticks and language tags.
- Use checklists for step-by-step procedures.

### Page structure

Each page starts with a 1-2 sentence summary, then clear sections. Core pages include: overview, key decisions, how to use, common tasks, gotchas.

## 4. Verify

After writing, verify:

- All links between pages resolve
- All Mermaid diagrams render
- Code snippets match actual code (re-read to confirm)
- Getting started instructions work (run the commands)
- No pages over 400 lines
