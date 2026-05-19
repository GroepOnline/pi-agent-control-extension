---
name: init
description: Initialize a new repository with AGENTS.md that documents build commands, architecture, and development conventions for future Pi sessions.
---
# Initialize AGENTS.md

Analyze this codebase and create an AGENTS.md file for future Pi sessions.

## What to include

1. **Commands**: how to build, lint, run tests, run a single test — the essential development commands.
2. **Architecture**: high-level code structure that requires reading multiple files to understand. Focus on big-picture architecture, not file listings.

## Guidelines

- If no AGENTS.md exists, create it directly. If one exists, show proposed changes and ask for confirmation.
- Don't repeat obvious instructions like "write unit tests" or "never include API keys."
- Don't list every component or file — that's easily discoverable.
- If there are Cursor rules (`.cursor/rules/`, `.cursorrules`), Copilot instructions (`.github/copilot-instructions.md`), or CLAUDE.md files: include the important parts.
- If there's a README.md: include the important parts.
- Don't make up sections like "Common Development Tasks" or "Tips for Development" unless present in existing docs.
- Don't include generic development practices.

## Process

1. Read README.md, AGENTS.md (if exists), package.json, build configs
2. Survey directory structure for major subsystems
3. Identify entry points, key data flows, external dependencies
4. Find build/test/lint commands from package.json scripts, Makefile, CI config
5. Write AGENTS.md with commands first, then architecture overview
