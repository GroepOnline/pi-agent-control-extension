# // COMPREHENSIVE MASTER PLAN

This document mandates the strategic roadmap and execution vectors for the Pi Agent Control Extension, mapping directly to objectives defined in [ROADMAP.md](ROADMAP.md).

---

## // PHASE 1: HARDENED CONTROL & COMPUTER USE (Q3 2026)

### // 1.1 BACKGROUND PTY SESSIONS
- **Objective:** Manage fully detached, long-running background PTYs with exact re-attachment.
- **Architecture:**
  - Modify `tctl` binary (`bin/tctl`) to force domain sockets for session multiplexing.
  - Inject `detach` and `attach` vectors into `true-input` and `tuistory` drivers (`extensions/pi-control/routing.ts`).
  - Deploy an asynchronous task queue to orchestrate massive agent workflows.

### // 1.2 ADVANCED COMPUTER USE INTEGRATION
- **Objective:** Deploy OS-level control schemas independent of browser wrappers.
- **Architecture:**
  - Natively execute headless X11/Wayland instances.
  - Implement `cage` for sandboxed Wayland sessions and `wtype` for raw event injection.
  - Interface capabilities via the `os-control` driver, converting `extensions/pi-control/tools/browser.ts` into a universal `system.ts`.

### // 1.3 LLM-POWERED GUARDRAILS
- **Objective:** Intercept destructive shell commands while permitting valid operations.
- **Architecture:**
  - Deprecate static regex checks in `extensions/pi-control/guards.ts`.
  - Deploy semantic analysis engines utilizing a specialized LLM or strict tree-sitter parsing.
  - Enforce custom security policies queryable by agents prior to execution.

---

## // PHASE 2: ENHANCED CAPTURE & QUALITY (Q4 2026)

### // 2.1 HIGH-FIDELITY SCREEN RECORDING
- **Objective:** Upgrade `screenshot` and `record` to output 60fps, 4K scaling, and lossless mp4 formats.
- **Architecture:**
  - Restructure Remotion pipelines (`remotion/`).
  - Implement explicit `ffmpeg` hardware acceleration flags (NVENC, VAAPI) within the `capture` skill.
  - Expand evidence schemas (`extensions/pi-control/schema.ts`) to validate high-resolution output data.

### // 2.2 STEADIER ORCHESTRATION ENGINE
- **Objective:** Enforce fault tolerance during PTY crashes and buffer flooding.
- **Architecture:**
  - Harden `tctl` wrapper with strict signal hooks (SIGTERM, SIGKILL).
  - Deploy an auto-recovery state machine to isolate orphaned processes.
  - Filter and rate-limit terminal escape sequences to protect control hub buffers.

---

## // PHASE 3: DISTRIBUTED CONTROL (2027+)

### // 3.1 REMOTE TMUX ORCHESTRATION
- **Objective:** Trigger and attach to remote SSH tmux sessions.
- **Architecture:**
  - Extend `tctl` to integrate SSH-based remote execution.
  - Enforce high-quality PTY evidence capture standards from staging environments.

### // 3.2 MULTI-AGENT SWARM SKILLS
- **Objective:** Execute subagent swarms in parallel for absolute codebase refactoring.
- **Architecture:**
  - Scale `mixed` driver chaining logic.
  - Deploy shared memory and event bus architectures across background PTYs to govern swarm coordination.
