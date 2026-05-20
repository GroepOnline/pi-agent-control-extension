import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { EVIDENCE_SCHEMA, SKILL_NAMES } from "./schema.ts";
import { renderRoute, routeControlTask } from "./routing.ts";
import { recipeFor, verifyCommitments } from "./recipes.ts";
import { inspectToolCall } from "./guards.ts";
import { browserControlGuidance, BROWSER_CONTROL_STATUS } from "./tools/browser.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_CURRENCY = "USD";

type UsageInput = {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  cachedInputTokens?: number;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  currency?: string;
};

type ParallelReport = {
  name: string;
  markdown: string;
  evidence?: string[];
};

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

function rootDir() {
  const candidates = [
    PACKAGE_ROOT,
    ...(existsSync(join(PACKAGE_ROOT, "package.json")) ? [] : [process.cwd()]),
  ];
  for (const d of candidates) {
    if (existsSync(join(d, "package.json"))) return d;
  }
  return PACKAGE_ROOT;
}

function listSkills(base: string) {
  const dir = join(base, "skills");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "SKILL.md")))
    .map((d) => {
      const text = readFileSync(join(dir, d.name, "SKILL.md"), "utf8");
      return { name: d.name, description: (text.match(/^description:\s*(.+)$/m)?.[1] ?? "").replace(/^['"]|['"]$/g, "") };
    });
}

function runValidator(root: string) {
  const script = join(root, "scripts", "validate-package.py");
  if (!existsSync(script)) return "scripts/validate-package.py not found.";
  const cmds: [string, string[]][] = process.platform === "win32"
    ? [["py", ["-3", script]], ["python", [script]], ["python3", [script]]]
    : [["python3", [script]], ["python", [script]]];
  for (const [cmd, args] of cmds) {
    try { return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch { }
  }
  return "Unable to run Python validator.";
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function money(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(6)}`;
}

function buildUsageReport(input: UsageInput = {}) {
  const promptTokens = finiteNumber(input.promptTokens);
  const completionTokens = finiteNumber(input.completionTokens);
  const cachedInputTokens = finiteNumber(input.cachedInputTokens);
  const billableInputTokens = Math.max(promptTokens - cachedInputTokens, 0);
  const inputCostPerMillion = finiteNumber(input.inputCostPerMillion);
  const outputCostPerMillion = finiteNumber(input.outputCostPerMillion);
  const currency = input.currency || DEFAULT_CURRENCY;
  const estimatedInputCost = (billableInputTokens / 1_000_000) * inputCostPerMillion;
  const estimatedOutputCost = (completionTokens / 1_000_000) * outputCostPerMillion;
  const estimatedTotalCost = estimatedInputCost + estimatedOutputCost;

  const lines = [
    "# Usage & Observability",
    "",
    `Model: ${input.model || "not provided"}`,
    `Prompt tokens: ${promptTokens}`,
    `Cached input tokens: ${cachedInputTokens}`,
    `Billable input tokens: ${billableInputTokens}`,
    `Completion tokens: ${completionTokens}`,
    `Input rate per 1M: ${money(inputCostPerMillion, currency)}`,
    `Output rate per 1M: ${money(outputCostPerMillion, currency)}`,
    `Estimated input cost: ${money(estimatedInputCost, currency)}`,
    `Estimated output cost: ${money(estimatedOutputCost, currency)}`,
    `Estimated total cost: ${money(estimatedTotalCost, currency)}`,
    "",
    "Suggestions:",
    "- Route with control_route before capturing so expensive loops use the right driver.",
    "- Prefer text snapshots for TUI proof before recording mp4 showcase material.",
    "- Use control_verify_commitments before rerunning a capture loop.",
  ];

  if (!promptTokens && !completionTokens) {
    lines.splice(2, 0, "No token counters were supplied. Pass promptTokens and completionTokens to control_usage for an estimate.", "");
  }

  return {
    text: lines.join("\n"),
    details: {
      model: input.model || null,
      promptTokens,
      completionTokens,
      cachedInputTokens,
      billableInputTokens,
      inputCostPerMillion,
      outputCostPerMillion,
      currency,
      estimatedInputCost,
      estimatedOutputCost,
      estimatedTotalCost,
    },
  };
}

function buildParallelVerifyReport(reports: ParallelReport[]) {
  if (!reports.length) {
    return {
      text: "# Targeted Parallel QA\n\nNo reports supplied. Pass reports with name, markdown, and optional evidence paths to control_parallel_verify.",
      details: { reports: [], ok: false },
    };
  }

  const checked = reports.map((report) => {
    const result = verifyCommitments(report.markdown || "");
    return {
      name: report.name,
      ok: result.ok,
      missing: result.failed,
      evidence: report.evidence ?? [],
      checks: result.checks,
    };
  });

  const lines = [
    "# Targeted Parallel QA",
    "",
    "| Report | Result | Evidence | Missing |",
    "|---|---|---|---|",
    ...checked.map((r) => `| ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${r.evidence.length ? r.evidence.join(", ") : "none listed"} | ${r.missing.length ? r.missing.join(", ") : "none"} |`),
    "",
    checked.every((r) => r.ok)
      ? "All supplied reports include the required commitment, evidence, and pass/fail signals."
      : "At least one report is missing required proof structure. Fix the missing sections before marking QA complete.",
  ];

  return { text: lines.join("\n"), details: { reports: checked, ok: checked.every((r) => r.ok) } };
}

export default function piControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    const n = listSkills(rootDir()).length;
    ctx.ui?.notify?.(`pi-agent-control loaded (${n} skills)`, "info");
  });

  pi.on("tool_call", async (event: unknown, _ctx: ExtensionContext) => inspectToolCall(event) || undefined);

  const show = (text: string) => async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(text, "info"); };
  const showFn = (fn: (s: string) => string) => async (args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(fn(args || ""), "info"); };

  pi.registerCommand("route-control", { description: "Route a control task: driver + skills + capture + recipe", handler: showFn((a) => renderRoute(routeControlTask(a))) });
  pi.registerCommand("skills-control", { description: "List bundled skill atoms", handler: async (_a, ctx: ExtensionContext) => { ctx.ui?.notify?.(listSkills(rootDir()).map((s) => `- ${s.name}: ${s.description}`).join("\n") || "No skills found.", "info"); } });
  pi.registerCommand("demo-control", { description: "Show tuistory capture recipe", handler: show(recipeFor("tuistory-launch")) });
  pi.registerCommand("verify-control", { description: "Show verification/evidence schema", handler: show(EVIDENCE_SCHEMA) });
  pi.registerCommand("qa-control", { description: "Show QA report template", handler: show(recipeFor("qa-report")) });
  pi.registerCommand("doctor-control", { description: "Run package validator", handler: showFn(() => runValidator(rootDir())) });
  pi.registerCommand("usage", { description: "Show usage and cost estimation guidance", handler: async (_a, ctx: ExtensionContext) => { ctx.ui?.notify?.(buildUsageReport({}).text, "info"); } });
  pi.registerCommand("control-hub", { description: "Show the recommended control extension stack", handler: show(CONTROL_HUB) });
  pi.registerCommand("parallel-qa", { description: "Show targeted parallel QA guidance", handler: show("Use control_parallel_verify with a list of named verification reports to check multiple QA proof targets at once.") });
  pi.registerCommand("browser-control", { description: "Show browser control status and guidance", handler: show(browserControlGuidance()) });

  pi.registerTool({
    name: "control_route",
    label: "Control Route",
    description: "Route a control task to the right driver, skills, capture format, deliverable, warnings, and recipe.",
    parameters: Type.Object({ task: Type.String(), deliverable: Type.Optional(Type.String()) }),
    async execute(_id: string, p: { task: string; deliverable?: string }) {
      const d = routeControlTask(p.task, p.deliverable ?? "");
      return { content: [{ type: "text", text: renderRoute(d) }], details: d };
    },
  });

  pi.registerTool({
    name: "control_recipe",
    label: "Control Recipe",
    description: "Return canonical commands for a workflow kind.",
    parameters: Type.Object({ kind: Type.String({ description: "tuistory-launch, browser-loop, showcase-compose, qa-report" }) }),
    async execute(_id: string, p: { kind: string }) {
      return { content: [{ type: "text", text: recipeFor(p.kind) }], details: { kind: p.kind } };
    },
  });

  pi.registerTool({
    name: "control_evidence_schema",
    label: "Evidence Schema",
    description: "Return the required evidence schema.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: EVIDENCE_SCHEMA }], details: {} };
    },
  });

  pi.registerTool({
    name: "control_skill_index",
    label: "Skill Index",
    description: "List bundled skill atoms.",
    parameters: Type.Object({}),
    async execute() {
      const skills = listSkills(rootDir());
      const missing = SKILL_NAMES.filter((s) => !skills.some((x) => x.name === s));
      const text = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n") + (missing.length ? `\n\nMissing: ${missing.join(", ")}` : "");
      return { content: [{ type: "text", text }], details: { skills, missing } };
    },
  });

  pi.registerTool({
    name: "control_doctor",
    label: "Package Doctor",
    description: "Run the package validator.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: runValidator(rootDir()) }], details: {} };
    },
  });

  pi.registerTool({
    name: "control_verify_commitments",
    label: "Verify Commitments",
    description: "Check if a verification report has core commitment/evidence sections.",
    parameters: Type.Object({ markdown: Type.String() }),
    async execute(_id: string, p: { markdown: string }) {
      const r = verifyCommitments(p.markdown);
      return { content: [{ type: "text", text: r.ok ? "Report passes." : `Missing: ${r.failed.join(", ")}` }], details: r };
    },
  });

  pi.registerTool({
    name: "control_usage",
    label: "Usage & Observability",
    description: "Estimate token usage cost and suggest lower-cost control workflow choices.",
    parameters: Type.Object({
      model: Type.Optional(Type.String()),
      promptTokens: Type.Optional(Type.Number()),
      completionTokens: Type.Optional(Type.Number()),
      cachedInputTokens: Type.Optional(Type.Number()),
      inputCostPerMillion: Type.Optional(Type.Number()),
      outputCostPerMillion: Type.Optional(Type.Number()),
      currency: Type.Optional(Type.String()),
    }),
    async execute(_id: string, p: UsageInput) {
      const report = buildUsageReport(p);
      return { content: [{ type: "text", text: report.text }], details: report.details };
    },
  });

  pi.registerTool({
    name: "control_parallel_verify",
    label: "Targeted Parallel QA",
    description: "Verify multiple named QA/proof reports in one structured pass without spawning general-purpose subagents.",
    parameters: Type.Object({
      reports: Type.Array(Type.Object({
        name: Type.String(),
        markdown: Type.String(),
        evidence: Type.Optional(Type.Array(Type.String())),
      })),
    }),
    async execute(_id: string, p: { reports: ParallelReport[] }) {
      const report = buildParallelVerifyReport(Array.isArray(p.reports) ? p.reports : []);
      return { content: [{ type: "text", text: report.text }], details: report.details };
    },
  });

  pi.registerTool({
    name: "control_browser_guidance",
    label: "Browser Guidance",
    description: "Get best practices and loop recipes for agent-browser and Electron automation.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: browserControlGuidance() }], details: { status: BROWSER_CONTROL_STATUS } };
    },
  });

  pi.registerTool({
    name: "control_browser_command",
    label: "Browser Command",
    description: "Execute an agent-browser CLI command (open, snapshot, click, fill, screenshot, close).",
    parameters: Type.Object({
      command: Type.String({ description: "The agent-browser subcommand and arguments (e.g., 'open https://google.com')" }),
      session: Type.Optional(Type.String({ description: "Optional session name" })),
    }),
    async execute(_id: string, p: { command: string; session?: string }) {
      const args = p.command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((a) => a.replace(/^["']|["']$/g, "")) ?? [];
      if (p.session) args.unshift("--session", p.session);
      try {
        const out = execFileSync("agent-browser", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
        return { content: [{ type: "text", text: out.trim() }], details: { command: p.command, success: true } };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }], details: { command: p.command, success: false, error: e.message } };
      }
    },
  });
}
