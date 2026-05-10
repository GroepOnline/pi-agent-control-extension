import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { EVIDENCE_SCHEMA, SKILL_NAMES } from "./schema.ts";
import { renderRoute, routeControlTask } from "./routing.ts";
import { recipeFor, verifyCommitments } from "./recipes.ts";
import { inspectToolCall } from "./guards.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

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
  const cmds = process.platform === "win32"
    ? [["py", ["-3", script]], ["python", [script]], ["python3", [script]]]
    : [["python3", [script]], ["python", [script]]];
  for (const [cmd, args] of cmds) {
    try { return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch { }
  }
  return "Unable to run Python validator.";
}

export default function piControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    const n = listSkills(rootDir()).length;
    ctx.ui?.notify?.(`pi-agent-control loaded (${n} skills)`, "info");
  });

  pi.on("tool_call", async (event: any, _ctx: any) => inspectToolCall(event));

  const show = (text: string) => (args: string, ctx: any) => ctx.ui?.notify?.(text, "info");
  const showFn = (fn: (s: string) => string) => (args: string, ctx: any) => ctx.ui?.notify?.(fn(args || ""), "info");

  pi.registerCommand("route-control", { description: "Route a control task: driver + skills + capture + recipe", handler: showFn((a) => renderRoute(routeControlTask(a))) });
  pi.registerCommand("skills-control", { description: "List bundled skill atoms", handler: (_a, ctx) => ctx.ui?.notify?.(listSkills(rootDir()).map((s) => `- ${s.name}: ${s.description}`).join("\n") || "No skills found.", "info") });
  pi.registerCommand("demo-control", { description: "Show tuistory capture recipe", handler: show(recipeFor("tuistory-launch")) });
  pi.registerCommand("verify-control", { description: "Show verification/evidence schema", handler: show(EVIDENCE_SCHEMA) });
  pi.registerCommand("qa-control", { description: "Show QA report template", handler: show(recipeFor("qa-report")) });
  pi.registerCommand("doctor-control", { description: "Run package validator", handler: showFn(() => runValidator(rootDir())) });

  pi.registerTool({
    name: "control_route",
    label: "Control Route",
    description: "Route a control task to the right driver, skills, capture format, deliverable, warnings, and recipe.",
    parameters: Type.Object({ task: Type.String(), deliverable: Type.Optional(Type.String()) }),
    async execute(_id: string, p: any) {
      const d = routeControlTask(p.task, p.deliverable ?? "");
      return { content: [{ type: "text", text: renderRoute(d) }], details: d };
    },
  });

  pi.registerTool({
    name: "control_recipe",
    label: "Control Recipe",
    description: "Return canonical commands for a workflow kind.",
    parameters: Type.Object({ kind: Type.String({ description: "tuistory-launch, browser-loop, showcase-compose, qa-report" }) }),
    async execute(_id: string, p: any) {
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
    async execute(_id: string, p: any) {
      const r = verifyCommitments(p.markdown);
      return { content: [{ type: "text", text: r.ok ? "Report passes." : `Missing: ${r.failed.join(", ")}` }], details: r };
    },
  });
}
