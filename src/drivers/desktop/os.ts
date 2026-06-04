export const OS_CONTROL_STATUS = {
  implemented: false,
  driver: "os-control",
  target: "X11/Wayland + native input injection (cage/wtype)",
  capabilities: ["window-management", "keyboard-injection", "mouse-injection", "display-capture"],
  eta: "Q3 2026",
} as const;

export function osControlGuidance() {
  return [
    "# OS Control (Computer Use)",
    "",
    "Status: **prototype** — agent-browser is the recommended driver for UI automation.",
    "",
    "When agent-browser cannot handle the target (e.g., native dialogs, desktop apps, OS settings):",
    "1. Use `cage` for a sandboxed Wayland session.",
    "2. Use `wtype` for raw keyboard/mouse injection into Wayland compositors.",
    "3. Use `grim`/`slurp` for region-selective screenshots.",
    "",
    "Route with: `control_route` using 'computer use' or 'os control' keywords.",
  ].join("\n");
}
