import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
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

export function formatRouteMarkdown(task: string) {
  const d = routeControlTask(task);
  return [
    `## Route Decision`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| **Driver** | ${d.driver} |`,
    `| **Deliverable** | ${d.deliverable} |`,
    `| **Capture** | ${d.capture} |`,
    `| **Skills** | ${d.skills.join(", ")} |`,
    `| **Warnings** | ${d.warnings.length ? d.warnings.map((w) => `⚠️ ${w}`).join("; ") : "none"} |`,
    ``,
    `### Recipe`,
    ...d.recipe.map((s, i) => `${i + 1}. ${s}`),
  ].join("\n");
}

export function formatUsageTable() {
  const r = buildUsageReport({});
  return [
    `## Usage & Observability`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| Model | ${r.details.model ?? "not provided"} |`,
    `| Prompt tokens | ${r.details.promptTokens} |`,
    `| Cached input tokens | ${r.details.cachedInputTokens} |`,
    `| Billable input tokens | ${r.details.billableInputTokens} |`,
    `| Completion tokens | ${r.details.completionTokens} |`,
    `| Estimated total cost | ${r.details.estimatedTotalCost.toFixed(6)} ${r.details.currency} |`,
    ``,
    `> Pass promptTokens and completionTokens to /usage for an accurate estimate.`,
  ].join("\n");
}

export function formatDoctor() {
  const raw = runValidator();
  const lines = raw.split("\n");
  const results: string[] = [];
  let allPass = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().includes("ok") || trimmed.toLowerCase().includes("pass")) {
      results.push(`✅ ${trimmed}`);
    } else if (trimmed.toLowerCase().includes("error") || trimmed.toLowerCase().includes("fail") || trimmed.toLowerCase().includes("missing")) {
      results.push(`❌ ${trimmed}`);
      allPass = false;
    } else {
      results.push(`ℹ️ ${trimmed}`);
    }
  }

  return [
    `## Doctor Report`,
    ``,
    allPass ? "✅ All checks passed" : "❌ Some checks failed",
    ``,
    ...results,
  ].join("\n");
}

export function formatBrowserControl() {
  const guidance = browserControlGuidance();
  let installed = "❌ not found in PATH";
  try {
    execFileSync("which", ["agent-browser"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000 });
    installed = "✅ installed";
  } catch { /* not installed */ }

  return [
    `## Browser Control Status`,
    ``,
    `| Check | Status |`,
    `|---|---|`,
    `| agent-browser CLI | ${installed} |`,
    ``,
    guidance,
  ].join("\n");
}

export function recipeList() {
  const recipes = ["tuistory-launch", "browser-loop", "showcase-compose", "qa-report"];
  return [
    `## Available Recipes`,
    ``,
    ...recipes.map((r) => `- **${r}**: \`/recipe-list ${r}\` or use control_recipe tool`),
    ``,
    `Use \`/demo-control\` for the tuistory launch recipe directly.`,
  ].join("\n");
}

export function evidenceNew() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const slug = `run-${ts}`;
  const dir = join(rootDir(), "artifacts", "runs", slug);
  try {
    mkdirSync(join(dir, "evidence"), { recursive: true });
    return [
      `## Evidence Run Created`,
      ``,
      `- **Run ID**: ${slug}`,
      `- **Directory**: ${dir}`,
      `- **Evidence subdir**: ${join(dir, "evidence")}`,
      ``,
      `Next steps: capture evidence into the evidence/ folder and write verification.md.`,
    ].join("\n");
  } catch (e: any) {
    return `Failed to create run directory: ${e.message}`;
  }
}

function tctlStatus() {
  try {
    const out = execFileSync("tctl", ["sessions"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000 }).trim();
    return [
      `## Active tctl Sessions`,
      ``,
      out || "No active sessions found.",
    ].join("\n");
  } catch (e: any) {
    return `Could not query tctl sessions: ${e.stderr || e.message}`;
  }
}

function skillDiff(args: string) {
  const name = args.trim();
  if (!name) return "Usage: /skill-diff <skill-name>";

  const repoRoot = rootDir();
  const piPath = join(repoRoot, "skills", name, "SKILL.md");
  const userPaths = [
    join(homedir(), ".agents", "skills", name, "SKILL.md"),
    join(homedir(), ".devin", "skills", name, "SKILL.md"),
    join(homedir(), ".claude", "skills", name, "SKILL.md"),
  ];

  const userPath = userPaths.find((p) => existsSync(p));
  if (!existsSync(piPath)) return `PI skill "${name}" not found at ${piPath}`;
  if (!userPath) return `User skill "${name}" not found in any user skill directory.`;

  try {
    const diff = execFileSync("diff", ["-u", piPath, userPath], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return `## Skill Diff: ${name}\n\nNo differences found.`;
  } catch (e: any) {
    const output = e.stdout || e.message || "diff failed";
    return [`## Skill Diff: ${name}`, "", "```diff", output, "```"].join("\n");
  }
}

export default function piControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    const n = listSkills(rootDir()).length;
    ctx.ui?.notify?.(`pi-agent-control loaded (${n} skills)`, "info");
  });

  pi.on("tool_call", async (event: unknown, _ctx: unknown) => inspectToolCall(event) || undefined);

  const show = (text: string) => async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(text, "info"); };
  const showFn = (fn: (s: string) => string) => async (args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(fn(args || ""), "info"); };

  pi.registerCommand("route-control", { description: "Route a control task: driver + skills + capture + recipe", handler: showFn((a) => formatRouteMarkdown(a)) });
  pi.registerCommand("skills-control", { description: "List bundled skill atoms", handler: async (_a: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(listSkills(rootDir()).map((s) => `- ${s.name}: ${s.description}`).join("\n") || "No skills found.", "info"); } });
  pi.registerCommand("demo-control", { description: "Show tuistory capture recipe", handler: show(recipeFor("tuistory-launch")) });
  pi.registerCommand("verify-control", { description: "Show verification/evidence schema", handler: show(EVIDENCE_SCHEMA) });
  pi.registerCommand("qa-control", { description: "Show QA report template", handler: show(recipeFor("qa-report")) });
  pi.registerCommand("doctor-control", { description: "Run package validator", handler: show(formatDoctor()) });
  pi.registerCommand("usage", { description: "Show usage and cost estimation guidance", handler: show(formatUsageTable()) });
  pi.registerCommand("control-hub", { description: "Show the recommended control extension stack", handler: show(CONTROL_HUB) });
  pi.registerCommand("parallel-qa", { description: "Show targeted parallel QA guidance", handler: show("Use control_parallel_verify with a list of named verification reports to check multiple QA proof targets at once.") });
  pi.registerCommand("browser-control", { description: "Show browser control status and guidance", handler: show(formatBrowserControl()) });

  // New commands
  pi.registerCommand("skill-studio", { description: "Launch the Skill Studio TUI (terminal dashboard)", handler: show("Run `bin/skill-studio` from the repo root to launch the interactive terminal UI for skill management.") });
  pi.registerCommand("recipe-list", { description: "List all available control recipes", handler: show(recipeList()) });
  pi.registerCommand("evidence-new", { description: "Generate a new evidence run directory", handler: show(evidenceNew()) });
  pi.registerCommand("tctl-status", { description: "Show active tctl sessions", handler: show(tctlStatus()) });
  pi.registerCommand("skill-diff", { description: "Diff user vs PI version of a skill", handler: showFn((a) => skillDiff(a)) });

  registerTools(pi);
}
