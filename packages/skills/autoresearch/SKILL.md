---
name: autoresearch
description: Autonomous research loop using subagents and web search. Use to investigate complex bugs, research architectural decisions, or optimize metrics without blocking the main orchestrator. Examples: "research this bug", "find solutions", "investigate architecture", "optimize metric", "deep dive"
---
# Autoresearch via Pi Subagents

Perform autonomous research and experimentation loops using Pi's native capabilities (`invoke_subagent` and `search_web`) rather than external bash scripts. This keeps the execution inside the agentic context where it can adapt instantly.

## The Approach

When an optimization goal or deep research task is required:

1. **Define the Goal**: What are we optimizing? What are the constraints?
2. **Launch the Subagent**: Do not block the main conversation. Use `invoke_subagent` with a cheaper, faster model (e.g., \`gemini-1.5-flash\` or \`claude-3-haiku\`).
3. **The Subagent's Mission**:
   - Give the subagent the \`search_web\` tool and read-only tools.
   - Instruct it to search for best practices, API documentation, or similar bug reports.
   - Instruct it to verify hypotheses locally (if given write access).
4. **Collect Results**: Once the subagent finishes, it will send a message back. Synthesize its findings into an actionable change.

## Using \`invoke_subagent\`

\`\`\`json
{
  "Subagents": [
    {
      "TypeName": "PiResearcher",
      "Role": "Autonomous Documentation and Code Researcher",
      "Prompt": "Research the optimal implementation of X. Use search_web to find official docs. Read local files Y and Z. Return a proposed patch or a markdown summary of the solution."
    }
  ]
}
\`\`\`

## When to use Autoresearch

- **After a failed Review**: If \`review\` flags an API usage as incorrect, launch \`autoresearch\` to find the correct usage.
- **Performance Optimization**: Launch a subagent to profile the code, read the flamegraphs, and suggest algorithmic improvements.
- **Dependency Upgrades**: When a library updates and breaks code, launch \`autoresearch\` to find the migration guide and apply the changes.

## Clean Finalization

Unlike legacy bash-based loops, the Pi subagent handles state automatically. When the subagent completes:
1. Ensure the findings are saved in an artifact (e.g., \`artifacts/research_summary.md\`).
2. Apply the successful patches to the main branch.
3. Use the \`pi-session-navigation\` skill to log the research result for future sessions.
