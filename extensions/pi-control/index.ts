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

const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(EXTENSION_DIR, "..", "..");

function packageRoot(ctx?: any) {
  const candidates = [
    PACKAGE_ROOT,
    ctx?.cwd,
    process.cwd(),
    resolve(process.cwd(), ".."),
  ].filter(Boolean).map(String);
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json")) && existsSync(join(candidate, "skills"))) {
      return candidate;
    }
  }
  return PACKAGE_ROOT;
}

function readSkillIndex(root: string) {
  const skillsRoot = join(root, "skills");
  if (!existsSync(skillsRoot)) return [];
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(skillsRoot, d.name, "SKILL.md")))
    .map((d) => {
      const p = join(skillsRoot, d.name, "SKILL.md");
      const text = readFileSync(p, "utf8");
      const title = text.match(/^#\s+(.+)$/m)?.[1] ?? d.name;
      const desc = text.match(/^description:\s*(.+)$/m)?.[1] ?? "";
      return { name: d.name, title, description: desc.replace(/^[']|[']$/g, "").replace(/^[\"]|[\"]$/g, ""), path: p };
    });
}

function runDoctor(root: string) {
  const script = join(root, "scripts", "validate-package.py");
  if (!existsSync(script)) return "No scripts/validate-package.py found.";

  const commands = process.platform === "win32"
    ? [["py", ["-3", script]], ["python", [script]], ["python3", [script]]]
    : [["python3", [script]], ["python", [script]]];

  const errors: string[] = [];
  for (const [cmd, args] of commands) {
    try {
      return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (err: any) {
      const stdout = err?.stdout ? String(err.stdout) : "";
      const stderr = err?.stderr ? String(err.stderr) : "";
      errors.push(`${cmd}: ${stdout}\n${stderr}`.trim());
    }
  }

  return errors.join("\n\n") || "Unable to run Python validator.";
}

export default function piControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    const root = packageRoot(ctx);
    const loaded = readSkillIndex(root).length;
    ctx.ui?.notify?.(`pi-control loaded (${loaded} skill atoms available)`, "info");
  });

  pi.on("tool_call", async (event: any, _ctx: any) => {
    return inspectToolCall(event);
  });

  pi.registerCommand("control", {
    description: "Route a Droid/Pi control task to the right driver, skills, capture format, and evidence workflow.",
    handler: async (args: string, ctx: any) => {
      const decision = routeControlTask(args || "control task");
      ctx.ui?.notify?.(renderRoute(decision), "info");
    },
  });

  pi.registerCommand("route-control", {
    description: "Print the route decision for a control task.",
    handler: async (args: string, ctx: any) => {
      ctx.ui?.notify?.(renderRoute(routeControlTask(args || "")), "info");
    },
  });

  pi.registerCommand("demo-control", {
    description: "Show the canonical tuistory demo capture command.",
    handler: async (_args: string, ctx: any) => ctx.ui?.notify?.(recipeFor("tuistory-launch"), "info"),
  });

  pi.registerCommand("verify-control", {
    description: "Show the required verification/evidence schema for control deliverables.",
    handler: async (_args: string, ctx: any) => ctx.ui?.notify?.(EVIDENCE_SCHEMA, "info"),
  });

  pi.registerCommand("qa-control", {
    description: "Show the QA report template.",
    handler: async (_args: string, ctx: any) => ctx.ui?.notify?.(recipeFor("qa-report"), "info"),
  });

  pi.registerCommand("doctor-control", {
    description: "Validate package structure and required skill atoms.",
    handler: async (_args: string, ctx: any) => ctx.ui?.notify?.(runDoctor(packageRoot(ctx)), "info"),
  });

  pi.registerCommand("skills-control", {
    description: "List control skill atoms loaded from this package.",
    handler: async (_args: string, ctx: any) => {
      const rows = readSkillIndex(packageRoot(ctx)).map((s) => `- ${s.name}: ${s.description}`).join("\n");
      ctx.ui?.notify?.(rows || "No skills found.", "info");
    },
  });

  pi.registerTool({
    name: "control_route",
    label: "Control Route",
    description: "Select the correct droid-control/Pi workflow: driver, skills, capture format, deliverable, warnings, and recipe.",
    parameters: Type.Object({
      task: Type.String({ description: "The user's control/capture/verification task." }),
      deliverable: Type.Optional(Type.String({ description: "Optional desired deliverable, e.g. qa-report or showcase-video." })),
    }),
    async execute(_toolCallId: string, params: any) {
      const decision = routeControlTask(params.task, params.deliverable ?? "");
      return { content: [{ type: "text", text: renderRoute(decision) }], details: decision };
    },
  });

  pi.registerTool({
    name: "control_recipe",
    label: "Control Recipe",
    description: "Return canonical commands/templates for common control workflows.",
    parameters: Type.Object({
      kind: Type.String({ description: "tuistory-launch, browser-loop, showcase-compose, qa-report" }),
    }),
    async execute(_toolCallId: string, params: any) {
      const text = recipeFor(params.kind);
      return { content: [{ type: "text", text }], details: { kind: params.kind } };
    },
  });

  pi.registerTool({
    name: "control_evidence_schema",
    label: "Evidence Schema",
    description: "Return the required evidence schema for control runs.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: EVIDENCE_SCHEMA }], details: {} };
    },
  });

  pi.registerTool({
    name: "control_skill_index",
    label: "Control Skill Index",
    description: "List the skill atoms bundled with the Pi control package.",
    parameters: Type.Object({}),
    async execute(_toolCallId: string, _params: any, _signal: any, _onUpdate: any, ctx: any) {
      const root = packageRoot(ctx);
      const skills = readSkillIndex(root);
      const missing = SKILL_NAMES.filter((s) => !skills.some((x) => x.name === s));
      const text = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n") + (missing.length ? `\n\nMissing: ${missing.join(", ")}` : "");
      return { content: [{ type: "text", text }], details: { skills, missing } };
    },
  });

  pi.registerTool({
    name: "control_doctor",
    label: "Control Doctor",
    description: "Run the package validator and return its output.",
    parameters: Type.Object({}),
    async execute(_toolCallId: string, _params: any, _signal: any, _onUpdate: any, ctx: any) {
      const output = runDoctor(packageRoot(ctx));
      return { content: [{ type: "text", text: output }], details: {} };
    },
  });

  pi.registerTool({
    name: "control_verify_commitments",
    label: "Verify Commitments",
    description: "Check whether a verification report contains core commitment/evidence sections.",
    parameters: Type.Object({
      markdown: Type.String({ description: "Verification report markdown." }),
    }),
    async execute(_toolCallId: string, params: any) {
      const result = verifyCommitments(params.markdown);
      const text = result.ok
        ? "Verification report has the required high-level sections."
        : `Missing/weak sections: ${result.failed.join(", ")}`;
      return { content: [{ type: "text", text }], details: result };
    },
  });
}
