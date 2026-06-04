# Comprehensive Master Plan

This document outlines the strategic roadmap and execution plan for the Pi Agent Control Extension, aligning with the objectives specified in [ROADMAP.md](./ROADMAP.md).

## Phase 1: Hardened Control & Computer Use (Q3 2026)

### 1.1 Background PTY Sessions
- **Objective:** Support fully detached, long-running background PTYs with seamless re-attachment.
- **Architecture:**
  - Extend the `tctl` binary (in `bin/tctl`) to utilize domain sockets for session multiplexing.
  - Implement a `detach` and `attach` mechanism within the `true-input` and `tuistory` drivers (`extensions/pi-control/routing.ts`).
  - Introduce an asynchronous task queue to manage massive agent workflows.

### 1.2 Advanced Computer Use Integration
- **Objective:** Introduce OS-level control features beyond browser wrappers.
- **Architecture:**
  - Natively orchestrate headless X11/Wayland instances.
  - Integrate `cage` for sandboxed Wayland sessions and `wtype` for raw keyboard/mouse event injection.
  - Expose these capabilities via a new `os-control` driver, expanding `extensions/pi-control/tools/browser.ts` into a generalized `system.ts`.

### 1.3 LLM-Powered Guardrails
- **Objective:** Detect complex destructive shell patterns without blocking legitimate operations.
- **Architecture:**
  - Replace the static regex-based checks in `extensions/pi-control/guards.ts`.
  - Implement a lightweight semantic analysis engine using a small, specialized LLM or advanced heuristic tree-sitter parsing.
  - Define custom security policies that agents can query before execution.

## Phase 2: Enhanced Capture & Quality (Q4 2026)

### 2.1 High-Fidelity Screen Recording
- **Objective:** Upgrade `screenshot` and `record` capabilities to 60fps, 4K scaling, and lossless mp4 encoding.
- **Architecture:**
  - Optimize the Remotion pipelines (`remotion/` directory).
  - Integrate advanced `ffmpeg` hardware acceleration flags (e.g., NVENC, VAAPI) within the `capture` skill.
  - Improve the evidence contract schemas (`extensions/pi-control/schema.ts`) to handle higher-resolution artifacts.

### 2.2 Steadier Orchestration Engine
- **Objective:** Flawlessly handle edge cases like sudden PTY crashes and escape sequence flooding.
- **Architecture:**
  - Hardening the `tctl` wrapper with aggressive signal handling (SIGTERM, SIGKILL).
  - Implement an auto-recovery state machine to reap orphaned processes.
  - Filter and rate-limit terminal escape sequences to prevent buffer overflows in the control hub.

## Phase 3: Distributed Control (2027+)

### 3.1 Remote Tmux Orchestration
- **Objective:** Launch and attach to tmux sessions on remote SSH targets.
- **Architecture:**
  - Extend `tctl` to support SSH-based remote execution.
  - Standardize high-quality PTY evidence capture from production/staging environments.

### 3.2 Multi-Agent Swarm Skills
- **Objective:** Launch multiple subagents in parallel for massive codebase refactoring.
- **Architecture:**
  - Expand the `mixed` driver chaining capabilities.
  - Introduce a shared memory and event bus across attached background PTYs to coordinate the swarm.
