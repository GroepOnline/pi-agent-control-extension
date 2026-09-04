# // ARCHITECTURE.md

## // PI AGENT CONTROL EXTENSION

Pi Agent Control Extension follows a strict Clean Architecture pattern to ensure modularity, testability, and portability across different agent runtimes and terminal environments.

---

## // CORE LAYERS

The codebase is organized into four distinct functional layers:

### 1. **src/core** (Domain & Schema)
- **Domain Logic**: Pure business rules and routing logic independent of external drivers.
- **Universal Routing**: The `routing.ts` engine which maps task intent to drivers and skills.
- **Schemas**: Strict TypeBox schemas for evidence, metrics, and configuration (`schema.ts`).

### 2. **src/drivers** (I/O & Execution)
- **Browser Driver**: CDP-based interaction via `agent-browser`.
- **Terminal/tctl Driver**: PTY management and TUI automation via `tuistory` and `tctl`.
- **Desktop/OS Driver**: Experimental OS-level control via `background-pty` and native input injection.

### 3. **src/extension** (Entry Points & Bridge)
- **Pi Integration**: Extension manifests and command registrations (`index.ts`).
- **Remote Bridge**: WebSocket server for remote agent orchestration (`bridge.ts`).
- **Tool Registry**: LLM-facing tool definitions and handlers.

### 4. **src/skill** (Skill Management)
- **Skill Inventory**: Registry and validation of bundled "skill atoms".
- **Studio TUI**: Interactive terminal dashboard for local skill development.
- **Skill Merge**: 3-way merge logic for syncing user skills with project updates.

---

## // ROUTING ENGINE

The routing engine (`packages/extension/routing.ts`) uses a keyword-based precedence system to determine the optimal execution path.

### // UNIVERSAL KEYWORDS
- **`agent-cli` / `control-cli`**: Routes to the Pi Agent CLI target atom.
- **`command` / `shell`**: Triggers terminal/TUI routing.
- **`tctl`**: Explicit support for the tctl control layer.

---

## // TEST SUITE

The project maintains a unified test suite using **Vitest** for TypeScript/Node components and **unittest** for Python-based skill helpers.

### // SHARED HELPERS
- **`compute_mad`**: Unified implementation for Median Absolute Deviation calculation used in performance metrics.
- **`find_baseline`**: Robust baseline detection for experiment comparison across different segments.

### // RUNNING TESTS
```bash
npm test                # Run TypeScript unit tests (Vitest)
npm run test:watch      # Vitest watch mode
npm run test:e2e        # Run end-to-end integration tests
pytest packages/skills  # Run Python-based skill atom tests
```

Tests are executed in CI/CD using the configured `tsx` runtime to ensure modern ESM compatibility.
