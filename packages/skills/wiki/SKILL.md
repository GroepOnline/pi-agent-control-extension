---
name: wiki
description: Generate comprehensive Pi-centric codebase documentation. Use when asked to map out an extension's architecture, document skill connections, or create internal developer wikis tailored for AI agents.
---
# Wiki Generation

Read the repository and produce an interconnected documentation wiki specifically optimized for Pi Agent extensions and automation workflows.

## Subagent Parallelization

If the codebase is large, do not attempt to read and write everything in one turn. Use the `invoke_subagent` tool to dispatch specialized research tasks to cheaper, faster models (e.g., `gemini-1.5-flash` or `claude-3-haiku`):

- **Subagent 1:** Map all `.pi/skills/` and `skills/` directories.
- **Subagent 2:** Map the core routing logic (e.g., `routing.ts`, `index.ts`).
- **Subagent 3:** Map evidence and verification guardrails.

Once the subagents return their summaries, synthesize them into the final wiki.

## The Output: `docs/wiki/`

Generate markdown files in `docs/wiki/`. The structure must follow Pi extension conventions:

\`\`\`text
docs/wiki/
├── index.md                 # Entry point: What this extension/repo does
├── architecture.md          # High-level component map with Mermaid
├── skills-catalog.md        # List of all registered Pi skills
├── routing-logic.md         # How intents map to drivers and capabilities
└── testing-and-evidence.md  # How to run checks and validate captures
\`\`\`

## Deep Scan Methodology

Look for Pi-specific paradigms:
- **Routing**: How does the user's intent get parsed into a `RouteDecision`?
- **Capture**: What formats are expected (e.g., `mp4`, `cast`, `screenshots`)?
- **Skills**: What atomized skills are available? Are they "control" or "general"?
- **Validation**: Is there a `validate-package.py` or equivalent strict constraint checking script?

## Drafting the Pages

### General Rules
- Use Mermaid diagrams heavily (e.g., `sequenceDiagram` for tool flow, `graph TD` for component mapping).
- Keep descriptions concise and agent-friendly. Avoid human-centric tutorials.
- Every skill listed must have a hyperlink to its actual `SKILL.md` file.
- Document any "guardrails" (e.g., blocked commands, restricted file paths).

### Chaining
Once the wiki is generated, if there are obvious gaps in test coverage or documentation, consider chaining into the `review` skill to audit the implementation, or `autoresearch` to find solutions.
