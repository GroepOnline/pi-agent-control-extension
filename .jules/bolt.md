## 2024-05-18 - Systemic synchronous I/O and regex compilation in hot paths
**Learning:** Found that `listSkills` reads multiple `SKILL.md` files synchronously every time it's called (e.g., when registering, handling commands, and tools). Additionally, `has()` inside `routing.ts` recompiles word-boundary `RegExp` objects on every check and performs redundant string lowercasing, and `guards.ts` eagerly lowercases tool arguments for non-shell tools. These small inefficiencies compound in extension lifecycles and event hooks.
**Action:** Implement a cohesive optimization strategy:
1. Add a memoization layer for static filesystem reads (`rootDir` and `listSkills`).
2. Cache RegExp objects in routing to avoid recompilation.
3. Defer string allocations (like `toLowerCase()`) in event interceptors (`inspectToolCall`) until the condition demands it.
