# Roadmap & Future Plans

The **Pi Agent Control Extension** is continuously evolving to provide the most robust environment for autonomous AI agent orchestration, verification, and terminal control. Our core philosophy is to focus on **rock-solid automation and deep system control**, avoiding superficial UI features in favor of pure, programmatic power.

## Q3 2026: Hardened Control & Computer Use
- [ ] **Background PTY Sessions**: Expand `true-input` and `tuistory` to support fully detached, long-running background PTYs with seamless re-attachment, allowing agents to spawn massive asynchronous workflows.
- [ ] **Advanced Computer Use Integration**: Introduce deeper OS-level control features (e.g., native headless X11/Wayland orchestration, raw keyboard/mouse event injection) to support complex "Computer Use" LLM scenarios beyond basic browser wrappers.
- [ ] **LLM-Powered Guardrails**: Upgrade the static regex-based `guards.ts` with lightweight semantic analysis to detect complex destructive shell patterns without blocking legitimate deep-system operations.

## Q4 2026: Enhanced Capture & Quality
- [ ] **High-Fidelity Screen Recording**: Upgrade the `screenshot` and `record` capabilities to support higher frame rates (60fps), 4K resolution scaling, and lossless mp4 encoding via optimized Remotion pipelines.
- [ ] **Steadier Orchestration Engine**: Hardening the `tctl` wrapper to flawlessly handle edge cases during sudden PTY crashes, orphaned processes, and aggressive terminal escape sequence flooding.

## 2027+: Distributed Control
- [ ] **Remote Tmux Orchestration**: Allow `tctl` to launch and attach to tmux sessions on remote SSH targets, capturing high-quality PTY evidence from production or staging servers.
- [ ] **Multi-Agent Swarm Skills**: Expand the chaining capabilities (`mixed` driver) to launch multiple subagents in parallel, all sharing attached background PTYs for massive codebase refactoring.
