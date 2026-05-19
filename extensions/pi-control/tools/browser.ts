export const BROWSER_CONTROL_STATUS = {
  implemented: true,
  driver: "agent-browser",
  runtime: "Playwright (via agent-browser CLI)",
  capabilities: ["navigation", "snapshot", "interaction", "screenshot", "recording"],
} as const;

export function browserControlGuidance() {
  return [
    "### Browser Control Best Practices",
    "1. **Route First**: Use `control_route` to confirm `agent-browser` is the correct driver.",
    "2. **Loop Flow**: `open` -> `snapshot` -> `action` (click/fill) -> `snapshot` (repeat).",
    "3. **Ref Stability**: DOM elements change; always re-snapshot after any navigation or modal change.",
    "4. **Visual Proof**: Use `screenshot --annotate` to tie visual evidence to interaction refs.",
    "5. **Clean Up**: Always call `close` at the end of a session to release resources.",
  ].join("\n");
}

