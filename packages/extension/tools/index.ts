import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { EVIDENCE_SCHEMA, SKILL_NAMES } from "../schema.ts";
import { renderRoute, routeControlTask } from "../routing.ts";
import { recipeFor, verifyCommitments } from "../recipes.ts";
import { browserControlGuidance, BROWSER_CONTROL_STATUS } from "./browser.ts";
import { osControlGuidance, osControlCommand, OS_CONTROL_STATUS } from "./os.ts";
import { browserCommandTool } from "./browser_command.ts";
import { shellCommandTool } from "./shell_command.ts";
import {
  rootDir,
  listSkills,
  runValidator,
  buildUsageReport,
  buildParallelVerifyReport,
  UsageInput,
  ParallelReport,
} from "../utils.ts";

const TOOLS = [
  {
    name: "control_route",
    label: "Control Route",
    description: "Route a control task to the right driver, skills, capture format, deliverable, warnings, and recipe.",
    parameters: Type.Object({ task: Type.String(), deliverable: Type.Optional(Type.String()) }),
    async execute(_id: string, p: { task: string; deliverable?: string }) {
      const d = routeControlTask(p.task, p.deliverable ?? "");
      return { content: [{ type: "text" as const, text: renderRoute(d) }], details: d };
    },
  },
  {
    name: "control_recipe",
    label: "Control Recipe",
    description: "Return canonical commands for a workflow kind.",
    parameters: Type.Object({ kind: Type.String({ description: "tuistory-launch, browser-loop, showcase-compose, qa-report" }) }),
    async execute(_id: string, p: { kind: string }) {
      return { content: [{ type: "text" as const, text: recipeFor(p.kind) }], details: { kind: p.kind } };
    },
  },
  {
    name: "control_evidence_schema",
    label: "Evidence Schema",
    description: "Return the required evidence schema.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text" as const, text: EVIDENCE_SCHEMA }], details: {} };
    },
  },
  {
    name: "control_skill_index",
    label: "Skill Index",
    description: "List bundled skill atoms.",
    parameters: Type.Object({}),
    async execute() {
      const skills = listSkills(rootDir());
      const missing = SKILL_NAMES.filter((s) => !skills.some((x) => x.name === s));
      const text = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n") + (missing.length ? `\n\nMissing: ${missing.join(", ")}` : "");
      return { content: [{ type: "text" as const, text }], details: { skills, missing } };
    },
  },
  {
    name: "control_doctor",
    label: "Package Doctor",
    description: "Run the package validator.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text" as const, text: runValidator() }], details: {} };
    },
  },
  {
    name: "control_verify_commitments",
    label: "Verify Commitments",
    description: "Check if a verification report has core commitment/evidence sections.",
    parameters: Type.Object({ markdown: Type.String() }),
    async execute(_id: string, p: { markdown: string }) {
      const r = verifyCommitments(p.markdown);
      return { content: [{ type: "text" as const, text: r.ok ? "Report passes." : `Missing: ${r.failed.join(", ")}` }], details: r };
    },
  },
  {
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
      return { content: [{ type: "text" as const, text: report.text }], details: report.details };
    },
  },
  {
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
      return { content: [{ type: "text" as const, text: report.text }], details: report.details };
    },
  },
  {
    name: "control_browser_guidance",
    label: "Browser Guidance",
    description: "Get best practices and loop recipes for agent-browser and Electron automation.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text" as const, text: browserControlGuidance() }], details: { status: BROWSER_CONTROL_STATUS } };
    },
  },
  {
    name: "control_os_guidance",
    label: "OS Control Guidance",
    description: "Get guidance for OS-level computer use automation (experimental).",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text" as const, text: osControlGuidance() }], details: { status: OS_CONTROL_STATUS } };
    },
  },
  {
    name: "control_os_command",
    label: "OS Command",
    description: "Execute an OS-level command via tmux session management (launch, send, type, capture, snapshot, list, kill, close).",
    parameters: Type.Object({
      action: Type.String({ description: "The OS control action: launch, send, type, capture, snapshot, list, kill, close" }),
      target: Type.Optional(Type.String({ description: "Session name (required for send, type, capture, snapshot, kill, close)" })),
      args: Type.Optional(Type.Array(Type.String(), { description: "Additional arguments (command for launch, text for send/type)" })),
    }),
    async execute(_id: string, p: { action: string; target?: string; args?: string[] }) {
      const result = osControlCommand(p.action, p.target, p.args);
      return {
        content: [{ type: "text" as const, text: result.output }],
        details: { action: p.action, target: p.target, args: p.args, success: result.success, sessionName: result.sessionName },
      };
    },
  },
  browserCommandTool,
  shellCommandTool,
];

export function registerTools(pi: ExtensionAPI) {
  for (const tool of TOOLS) {
    pi.registerTool(tool);
  }
}
