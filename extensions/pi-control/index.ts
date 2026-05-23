import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { EVIDENCE_SCHEMA } from "./schema.ts";
import { renderRoute, routeControlTask } from "./routing.ts";
import { recipeFor } from "./recipes.ts";
import { inspectToolCall } from "./guards.ts";
import { browserControlGuidance } from "./tools/browser.ts";
import { rootDir, listSkills, runValidator, buildUsageReport } from "./utils.ts";
import { registerTools } from "./tools/index.ts";

const CONTROL_HUB = `# Control Hub

Recommended extension stack:

1. Route first with /route-control or control_route.
2. Capture with tuistory, true-input, or agent-browser depending on the routed driver.
3. Verify commitments with /verify-control or control_verify_commitments.
4. Produce QA evidence with /qa-control or control_parallel_verify.
5. Inspect cost and token usage with /usage or control_usage.

Composability rules:

- Use pi-agent-control for routing and proof contracts.
- Use agent-browser for browser and Electron UI loops.
- Use tuistory for deterministic TUI capture.
- Use true-input when terminal emulator key behavior matters.
- Use showcase and compose only after the verification report is already supported by evidence.`;

export default function piControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    const n = listSkills(rootDir()).length;
    ctx.ui?.notify?.(`pi-agent-control loaded (${n} skills)`, "info");
  });

  pi.on("tool_call", async (event: unknown, _ctx: unknown) => inspectToolCall(event) || undefined);

  const show = (text: string) => async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(text, "info"); };
  const showFn = (fn: (s: string) => string) => async (args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(fn(args || ""), "info"); };

  pi.registerCommand("route-control", { description: "Route a control task: driver + skills + capture + recipe", handler: showFn((a) => renderRoute(routeControlTask(a))) });
  pi.registerCommand("skills-control", { description: "List bundled skill atoms", handler: async (_a, ctx: ExtensionContext) => { ctx.ui?.notify?.(listSkills(rootDir()).map((s) => `- ${s.name}: ${s.description}`).join("\n") || "No skills found.", "info"); } });
  pi.registerCommand("demo-control", { description: "Show tuistory capture recipe", handler: show(recipeFor("tuistory-launch")) });
  pi.registerCommand("verify-control", { description: "Show verification/evidence schema", handler: show(EVIDENCE_SCHEMA) });
  pi.registerCommand("qa-control", { description: "Show QA report template", handler: show(recipeFor("qa-report")) });
  pi.registerCommand("doctor-control", { description: "Run package validator", handler: showFn(() => runValidator()) });
  pi.registerCommand("usage", { description: "Show usage and cost estimation guidance", handler: async (_a, ctx: ExtensionContext) => { ctx.ui?.notify?.(buildUsageReport({}).text, "info"); } });
  pi.registerCommand("control-hub", { description: "Show the recommended control extension stack", handler: show(CONTROL_HUB) });
  pi.registerCommand("parallel-qa", { description: "Show targeted parallel QA guidance", handler: show("Use control_parallel_verify with a list of named verification reports to check multiple QA proof targets at once.") });
  pi.registerCommand("browser-control", { description: "Show browser control status and guidance", handler: show(browserControlGuidance()) });

  registerTools(pi);
}
