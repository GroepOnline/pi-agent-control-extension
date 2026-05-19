# Roadmap & Future Plans

The **Pi Agent Control Extension** is continuously evolving to provide the most robust environment for autonomous AI agent orchestration, verification, and UI/TUI testing. 

## Q3 2026: Advanced Telemetry & Observability
- [ ] **Rich Dashboarding**: Introduce a local web interface to visualize token usage, cost estimation, and tool-call frequency over time.
- [ ] **LLM-Powered Guardrails**: Upgrade the static regex-based `guards.ts` with lightweight semantic analysis to detect complex destructive shell patterns.
- [ ] **Artifact Archiving**: Auto-compress and rotate the `artifacts/runs/` directory to prevent disk bloat on long-running QA servers.

## Q4 2026: Deeper Browser & UI Integration
- [ ] **Native Playwright/Puppeteer Bridge**: Bypass `agent-browser` CLI wrappers and integrate directly with CDP (Chrome DevTools Protocol) for faster, stateful browser manipulation.
- [ ] **Visual Diffing**: Automatically compare `screenshots/` against a baseline to flag UI regressions as part of the `qa-control` report.

## 2027+: Distributed Control
- [ ] **Remote Tmux Orchestration**: Allow `tctl` to launch and attach to tmux sessions on remote SSH targets, capturing proof from production or staging servers.
- [ ] **Multi-Agent Swarm Skills**: Expand the chaining capabilities (`mixed` driver) to launch multiple subagents in parallel for massive codebase refactoring.
