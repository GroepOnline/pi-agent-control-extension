import { Type } from "typebox";
import { execFileSync } from "node:child_process";

export const ALLOWED_ACTIONS = ["open", "snapshot", "click", "fill", "screenshot", "close"];

export const browserCommandTool = {
  name: "control_browser_command",
  label: "Browser Command",
  description: "Execute an agent-browser CLI command (open, snapshot, click, fill, screenshot, close).",
  parameters: Type.Object({
    action: Type.String({ description: "The agent-browser subcommand (e.g., 'open', 'click', 'fill')" }),
    target: Type.Optional(Type.String({ description: "The primary target (e.g., URL for open, selector for click/fill)" })),
    args: Type.Optional(Type.Array(Type.String(), { description: "Any additional arguments" })),
    session: Type.Optional(Type.String({ description: "Optional session name" })),
  }),
  async execute(_id: string, p: { action: string; target?: string; args?: string[]; session?: string }) {
    if (!ALLOWED_ACTIONS.includes(p.action)) {
      return { content: [{ type: "text" as const, text: `Error: Invalid action '${p.action}'. Allowed actions are: ${ALLOWED_ACTIONS.join(', ')}.` }], details: { action: p.action, target: p.target, args: p.args, success: false, error: "Invalid action" } };
    }
    const execArgs: string[] = [p.action];
    if (p.target !== undefined) execArgs.push(p.target);
    if (p.args !== undefined) execArgs.push(...p.args);
    if (p.session) execArgs.unshift("--session", p.session);
    try {
      const out = execFileSync("agent-browser", execArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
      return { content: [{ type: "text" as const, text: out.trim() }], details: { action: p.action, target: p.target, args: p.args, success: true, error: "" } };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.stderr || e.message}` }], details: { action: p.action, target: p.target, args: p.args, success: false, error: e.message as string } };
    }
  },
};
