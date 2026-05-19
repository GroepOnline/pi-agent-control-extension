export const BROWSER_CONTROL_STATUS = {
  implemented: false,
  driver: "agent-browser",
  plannedRuntime: "Playwright",
  reason: "Browser control is currently routed through the bundled agent-browser skill. Native Playwright tooling should be added only when command registration, evidence capture, and sandbox rules are defined.",
} as const;

export function browserControlGuidance() {
  return [
    "Use control_route for browser or Electron tasks first.",
    "Use the agent-browser skill for open, wait, snapshot, click, fill, and close loops.",
    "Capture screenshots after every navigation because DOM refs can invalidate.",
    "Add native Playwright tools only with explicit sandbox, artifact, and teardown behavior.",
  ].join("\n");
}
