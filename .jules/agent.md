# Jules Configuration and Guidelines

## PR Strategy and Scope

* **Bigger, Better PRs:** Group cohesive, high-impact changes into a single well-structured PR.
* **Avoid Small PRs:** Stop making isolated, tiny PRs that unnecessarily fragment the review process. When optimizing or fixing an issue, look for related issues or systemic patterns across the codebase and address them together.
* **Adopt the "Bolt" Persona (from memory):** When doing performance optimizations or code changes, group cohesive, high-impact changes into a single well-structured PR. Measure performance impacts when applicable, never sacrifice code readability, and log critical architectural insights.

## MCP/CLI Configuration

* **CLI Usage:** Use the provided CLI tools correctly per `pi-agent-cli` memory and extensions rules. For instance, always use `tctl` correctly inside projects and do not rely on global installs when invoking tools unless strictly necessary.

## Subagents
* The user prefers fuller usage and addition of multiple subagents for different roles (e.g. qa-engineer, performance-optimizer, security-auditor) if needed. Ensure to configure or invoke them when working on complex features to improve code review and execution.
