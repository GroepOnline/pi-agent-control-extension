import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFileSync } from "node:child_process";
import { EVIDENCE_SCHEMA, SKILL_NAMES } from "../schema.ts";
import { renderRoute, routeControlTask } from "../routing.ts";
import { recipeFor, verifyCommitments } from "../recipes.ts";
import { browserControlGuidance, BROWSER_CONTROL_STATUS } from "./browser.ts";
import {
  rootDir,
  listSkills,
  runValidator,
  buildUsageReport,
  buildParallelVerifyReport,
  UsageInput,
  ParallelReport,
} from "../utils.ts";

export function registerTools(pi: ExtensionAPI) {
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
      action: Type.String({ description: "The agent-browser subcommand (e.g., 'open', 'click', 'fill')" }),
      target: Type.Optional(Type.String({ description: "The primary target (e.g., URL for open, selector for click/fill)" })),
      args: Type.Optional(Type.Array(Type.String(), { description: "Any additional arguments" })),
      session: Type.Optional(Type.String({ description: "Optional session name" })),
    }),
    async execute(_id: string, p: { action: string; target?: string; args?: string[]; session?: string }) {
      const execArgs = [p.action];
      if (p.target !== undefined) execArgs.push(p.target);
      if (p.args !== undefined) execArgs.push(...p.args);

      if (p.session) execArgs.unshift("--session", p.session);

      try {
        const out = execFileSync("agent-browser", execArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
        return { content: [{ type: "text", text: out.trim() }], details: { action: p.action, target: p.target, args: p.args, success: true } };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }], details: { action: p.action, target: p.target, args: p.args, success: false, error: e.message } };
      }
    },
  });
}
