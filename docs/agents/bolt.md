## 2026-05-28 - Systemic synchronous I/O and regex compilation in hot paths
**Learning:** Found that `listSkills` reads multiple `SKILL.md` files synchronously every time it's called (e.g., when registering, handling commands, and tools). Additionally, `has()` inside `routing.ts` recompiles word-boundary `RegExp` objects on every check and performs redundant string lowercasing, and `guards.ts` eagerly lowercases tool arguments for non-shell tools. These small inefficiencies compound in extension lifecycles and event hooks.
**Action:** Implement a cohesive optimization strategy:
1. Add a memoization layer for static filesystem reads (`rootDir` and `listSkills`).
2. Cache RegExp objects in routing to avoid recompilation.
3. Defer string allocations (like `toLowerCase()`) in event interceptors (`inspectToolCall`) until the condition demands it.

## 2026-05-29 - Performance optimization in `scanDir`
Replaced `.filter().map()` array chaining in `extensions/pi-control/cli.ts` `scanDir` with a single `for` loop, mitigating performance overheads associated with creating an intermediate array.

## 2026-05-29 - Performance optimization of buildRegistry loop
- **What**: Replaced Map creation with Set creation, using plain loops for collecting keys instead of `Array.map`. Replaced object spread operator (`...skill`) with explicit property assignments. Pre-allocated the target array (`new Array(...)`) instead of using `.push()`.
- **Why**: Prevent object instantiation overhead when creating Map values and Array elements from `.map()`, reduce spread operator overhead in tight loop processing thousands of elements, and avoid array reallocation/resizing during push loops.
