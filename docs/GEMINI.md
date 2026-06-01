# GEMINI System Directions & Autonomy Configuration

## 1. Core Operating Mode: High Autonomy & Maximum Efficiency
* **Unrestricted Autonomy**: Execute complete plans from start to finish. Do not halt, pause, or ask for step-by-step approvals unless there is an irreversible destructive risk or an ambiguous architecture block.
* **Proactive Problem Solving**: If a tool, script, test, or build command fails, immediately search the errors, write diagnostic scripts, inspect logs, correct the code, and retry. Never report a failure without first attempting to resolve it.
* **Token Optimization & Complete Output**: 
  * Maximize output token generation to write complete, fully-functional, robust code.
  * Avoid placeholders, `// TODO` comments, or truncated snippets.
  * Provide fully written files with comprehensive error handling.
* **Parallel Execution**: Chain tool calls, run background tasks (`run_command` asynchronously), and process workspace tasks concurrently to minimize user waiting times.

---

## 2. Multi-Repository Workspace Map (`/home/jan/OnlineChefgroep`)
The workspace contains 9 highly integrated repositories. Coordinate edits across these boundaries seamlessly:

1. **`hermes-agent-platform`**: Core platform runtime and system layer for the Hermes Agent.
2. **`pi-agent-control-extension`**: Command center and interactive terminal control console extension for the Pi agent.
3. **`Pi-Helios-Memory-Private`**: Private semantic, short-term, and long-term memory layer for Helios/Pi.
4. **`pi-missions`**: Task runner, workflow orchestrator, and mission tracker for autonomous agent runs.
5. **`terminal-motion-tui`**: Physics-based layout, animation, and UI rendering engine for terminal Bubble Tea interfaces.
6. **`bubbletea-cinematic`**: Cinematic cinematic-grade rendering components and layout assets for Bubble Tea TUIs.
7. **`Context-UI`**: Interactive front-end visualization for agent memory, context windows, and operation history.
8. **`pi-folder-sorter`**: Automated folder classification, metadata tagging, and organization daemon.
9. **`helios-agent-grok-experiment`**: Experimental playground for LLM/Grok agent architectures.

---

## 3. Technology Stack & Coding Standards
* **Backend**: Python 3, Node.js (TypeScript/ESM).
* **CLI/TUI**: Bubble Tea (Go/Python equivalents), Terminal Motion engine, advanced rich terminal utilities.
* **Integrations**: Azure OpenAI Foundry, Azure Cognitive Services, GitHub API, local LLM endpoints.
* **Quality Assurance**: Proactively write and run unit tests, validation scripts (`npm run validate`, `pytest`), and linters after modifications to verify correctness.

---

## 4. Execution Directives
1. **Install Missing Packages**: If an import or package is missing, run the appropriate package manager command (`pip install`, `npm install`, `go get`) autonomously.
2. **Robust Context Inspection**: When analyzing bugs, always read logs, review environmental variables (`/home/jan/.pi/agent/auth.json`, etc.), and examine full error traces.
3. **Commit & Push Preparedness**: Ensure changes are clean, documented, and fully tested before completing work.
