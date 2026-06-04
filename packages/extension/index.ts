import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { execFileSync, execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { EVIDENCE_SCHEMA } from "./schema.ts";
import { renderRoute, routeControlTask } from "./routing.ts";
import { recipeFor } from "./recipes.ts";
import { inspectToolCall } from "./guards.ts";
import { browserControlGuidance } from "./tools/browser.ts";
import { rootDir, listSkills, runValidator, buildUsageReport } from "./utils.ts";
import { registerCapture } from "./capture.ts";
import { registerBridge } from "./bridge.ts";
import { mergeSkill, listMergeStates } from "./skill-merge.ts";
import { registerTools } from "./tools/index.ts";
import { telemetry } from "./telemetry.ts";

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
    const cmd = process.platform === "win32" ? "where" : "which";
    execFileSync(cmd, ["agent-browser"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000 });
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

const VALID_SKILL_NAME = /^[a-zA-Z0-9_-]+$/;

function skillDiff(args: string) {
  const name = args.trim();
  if (!name) return "Usage: /skill-diff <skill-name>";
  if (!VALID_SKILL_NAME.test(name)) return `Invalid skill name "${name}". Use only letters, numbers, hyphens, and underscores.`;

  const repoRoot = rootDir();
  const piPath = join(repoRoot, "packages", "skills", name, "SKILL.md");
  const userPaths = [
    join(homedir(), ".gemini", "config", "skills", name, "SKILL.md"),
    join(homedir(), ".agents", "skills", name, "SKILL.md"),
    join(homedir(), ".devin", "skills", name, "SKILL.md"),
    join(homedir(), ".claude", "skills", name, "SKILL.md"),
  ];

  const userPath = userPaths.find((p) => existsSync(p));
  if (!existsSync(piPath)) return `Bundled skill "${name}" not found at ${piPath}`;
  if (!userPath) return `User skill "${name}" not found in any user skill directory.`;

  try {
    const diff = execFileSync("diff", ["-u", piPath, userPath], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return `## Skill Diff: ${name}\n\nNo differences found.`;
  } catch (e: any) {
    const output = e.stdout || e.message || "diff failed";
    return [`## Skill Diff: ${name}`, "", "```diff", output, "```"].join("\n");
  }
}

export function skillSearch(args: string) {
  const query = args.trim().toLowerCase();
  if (!query) return "Usage: /skill-search <query>";
  const skills = listSkills(rootDir());
  const matches = skills.filter((s) => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  if (!matches.length) return `No skills matching "${query}".`;
  return [
    `## Skill Search: "${query}"`,
    "",
    ...matches.map((s) => `- **${s.name}**: ${s.description || "(no description)"}`),
  ].join("\n");
}

export function skillInfo(args: string) {
  const name = args.trim();
  if (!name) return "Usage: /skill-info <skill-name>";
  if (!VALID_SKILL_NAME.test(name)) return `Invalid skill name "${name}". Use only letters, numbers, hyphens, and underscores.`;
  const repoRoot = rootDir();
  const paths = [
    join(repoRoot, "packages", "skills", name, "SKILL.md"),
    join(homedir(), ".gemini", "config", "skills", name, "SKILL.md"),
    join(homedir(), ".agents", "skills", name, "SKILL.md"),
    join(homedir(), ".devin", "skills", name, "SKILL.md"),
    join(homedir(), ".claude", "skills", name, "SKILL.md"),
  ];
  const found = paths.find((p) => existsSync(p));
  if (!found) return `Skill "${name}" not found.`;
  try {
    const content = readFileSync(found, "utf8");
    const lines = content.split("\n").slice(0, 30);
    return [`## Skill Info: ${name}`, "", `**Path**: ${found}`, "", "\`\`\`yaml", ...lines, "\`\`\`"].join("\n");
  } catch (e: any) {
    return `Could not read skill: ${e.message}`;
  }
}

export function presetList() {
  const presets = ["warm", "pi-warm", "warm-hero", "pi-hero", "hero", "macos", "presentation", "minimal", "dark-pro", "neon", "paper", "ocean"];
  return [
    `## Remotion Presets`,
    "",
    ...presets.map((p) => `- **${p}**`),
    "",
    `Use \`preset: '<name>'\` in your showcase config.`,
  ].join("\n");
}

export function transitionList() {
  const transitions = ["motion-blur", "flash", "whip-pan", "light-leak", "glitch-lite", "scan-line", "vignette", "grain", "chromatic", "ripple", "pixelate", "blur-zoom", "split", "radial-wipe", "slide", "mosaic"];
  return [
    `## Remotion Transitions`,
    "",
    ...transitions.map((t) => `- **${t}**`),
    "",
    `Use \`transitionStyle: '<name>'\` in your showcase config.`,
  ].join("\n");
}

function execAsync(cmd: string, args: string[], timeout = 120000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { encoding: "utf8", timeout }, (err, stdout, stderr) => {
      if (err) reject({ ...err, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

export function showcasePreview(args: string) {
  const parts = args.trim().split(/\s+/);
  const recipe = parts[0] || "showcase-compose";
  const capturePath = parts[1];
  const outPath = parts[2] || `artifacts/showcases/${recipe}.mp4`;

  const recipes = ["tuistory-launch", "browser-loop", "showcase-compose", "qa-report"];
  if (!recipes.includes(recipe)) {
    return `Unknown recipe "${recipe}". Known: ${recipes.join(", ")}`;
  }

  return [
    `## Showcase Preview: ${recipe}`,
    "",
    `| Field | Value |`,
    `|---|---|`,
    `| **Recipe** | ${recipe} |`,
    `| **Capture binding** | ${capturePath || "(none)"} |`,
    `| **Output path** | ${outPath} |`,
    `| **Command** | \`npx tsx apps/remotion/scripts/render-showcase.ts ${recipe}${capturePath ? ` ${capturePath}` : ""}${outPath ? ` ${outPath}` : ""}\` |`,
    "",
    `Preset, layout, and transition are auto-selected per recipe.`,
    `Run \`/showcase-render ${recipe}\` to execute.`,
  ].join("\n");
}

export async function showcaseRender(args: string): Promise<string> {
  const parts = args.trim().split(/\s+/);
  const recipe = parts[0] || "showcase-compose";
  const capturePath = parts[1];
  const outPath = parts[2];

  const recipes = ["tuistory-launch", "browser-loop", "showcase-compose", "qa-report"];
  if (!recipes.includes(recipe)) {
    return `Unknown recipe "${recipe}". Known: ${recipes.join(", ")}`;
  }

  const hasPathTraversal = (p: string) => p.includes("..") || p.startsWith("/");
  if (capturePath && hasPathTraversal(capturePath)) return `Invalid capturePath: path traversal detected.`;
  if (outPath && hasPathTraversal(outPath)) return `Invalid outPath: path traversal detected.`;

  const extraArgs: string[] = [];
  if (capturePath) extraArgs.push(capturePath);
  if (outPath) extraArgs.push(outPath);

  try {
    const { stdout, stderr } = await execAsync("npx", ["tsx", "apps/remotion/scripts/render-showcase.ts", recipe, ...extraArgs], 300000);
    const lines = stdout.split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1];
    let result: { ok?: boolean; outputPath?: string; sizeInBytes?: number; durationInFrames?: number; error?: string } = {};
    try { result = JSON.parse(lastLine); } catch { /* ignore */ }

    if (result.ok) {
      return [
        `## Showcase Render: ${recipe}`,
        "",
        `✅ Render complete`,
        ``,
        `| Field | Value |`,
        `|---|---|`,
        `| **Output** | ${result.outputPath} |`,
        `| **Size** | ${((result.sizeInBytes ?? 0) / 1024 / 1024).toFixed(2)} MB |`,
        `| **Frames** | ${result.durationInFrames} |`,
      ].join("\n");
    }
    return `## Showcase Render: ${recipe}\n\n❌ Render failed\n\n\`\`\`\n${stderr || stdout}\n\`\`\``;
  } catch (e: any) {
    return `## Showcase Render: ${recipe}\n\n❌ Render failed: ${e.stderr || e.stdout || e.message}`;
  }
}

export default function agyControlExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    telemetry.init();
    telemetry.increment("session_start");
    const n = listSkills(rootDir()).length;
    ctx.ui?.notify?.(`agy-agent-control loaded (${n} skills)`, "info");
  });

  pi.on("tool_call", async (event: unknown, _ctx: unknown) => {
    const start = Date.now();
    telemetry.increment("tool_call");
    const guard = inspectToolCall(event) || undefined;
    const durationMs = Date.now() - start;
    const toolName = String((event as any)?.toolName ?? (event as any)?.name ?? "unknown").slice(0, 80);
    telemetry.record("tool_call", { toolName, blocked: !!guard?.block }, durationMs);
    return guard;
  });

  const show = (text: string) => async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(text, "info"); };
  const showFn = (fn: (s: string) => string) => async (args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(fn(args || ""), "info"); };

  pi.registerCommand("route-control", {
    description: "Route a control task: driver + skills + capture + recipe",
    handler: async (args: string, ctx: ExtensionContext) => {
      const start = Date.now();
      telemetry.increment("command_invoked");
      try {
        const result = formatRouteMarkdown(args);
        telemetry.record("command_complete", { command: "route-control" }, Date.now() - start);
        ctx.ui?.notify?.(result, "info");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        telemetry.record("command_error", { command: "route-control", error: message }, Date.now() - start);
        ctx.ui?.notify?.(`Error: ${message}`, "error");
      }
    },
  });
  pi.registerCommand("skills-control", { description: "List bundled skill atoms", handler: async (_a: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(listSkills(rootDir()).map((s) => `- ${s.name}: ${s.description}`).join("\n") || "No skills found.", "info"); } });
  pi.registerCommand("demo-control", { description: "Show tuistory capture recipe", handler: show(recipeFor("tuistory-launch")) });
  pi.registerCommand("verify-control", { description: "Show verification/evidence schema", handler: show(EVIDENCE_SCHEMA) });
  pi.registerCommand("qa-control", { description: "Show QA report template", handler: show(recipeFor("qa-report")) });
  pi.registerCommand("doctor-control", { description: "Run package validator", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(formatDoctor(), "info"); } });
  pi.registerCommand("usage", { description: "Show usage and cost estimation guidance", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(formatUsageTable(), "info"); } });
  pi.registerCommand("control-hub", { description: "Show the recommended control extension stack", handler: show(CONTROL_HUB) });
  pi.registerCommand("parallel-qa", { description: "Show targeted parallel QA guidance", handler: show("Use control_parallel_verify with a list of named verification reports to check multiple QA proof targets at once.") });
  pi.registerCommand("browser-control", { description: "Show browser control status and guidance", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(formatBrowserControl(), "info"); } });

  // New commands
  pi.registerCommand("skill-studio", { description: "Launch the Skill Studio TUI (terminal dashboard)", handler: show("Run `bin/skill-studio` from the repo root to launch the interactive terminal UI for skill management.") });
  pi.registerCommand("recipe-list", { description: "List all available control recipes", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(recipeList(), "info"); } });
  pi.registerCommand("evidence-new", { description: "Generate a new evidence run directory", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(evidenceNew(), "info"); } });
  pi.registerCommand("tctl-status", { description: "Show active tctl sessions", handler: async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(tctlStatus(), "info"); } });
  pi.registerCommand("skill-diff", { description: "Diff user vs PI version of a skill", handler: showFn((a) => skillDiff(a)) });
  pi.registerCommand("skill-search", { description: "Search skills by name or description", handler: showFn((a) => skillSearch(a)) });
  pi.registerCommand("skill-info", { description: "Show detailed info about a skill", handler: showFn((a) => skillInfo(a)) });
  pi.registerCommand("preset-list", { description: "List all Remotion color presets", handler: show(presetList()) });
  pi.registerCommand("transition-list", { description: "List all Remotion transition styles", handler: show(transitionList()) });
  pi.registerCommand("showcase-preview", { description: "Preview showcase render props for a recipe", handler: showFn((a) => showcasePreview(a)) });
  pi.registerCommand("showcase-render", { description: "Render a Remotion showcase video from a recipe", handler: async (args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(await showcaseRender(args), "info"); } });

  pi.registerCommand("skill-merge", { description: "3-way merge a user skill with its PI version", handler: showFn((a) => {
    const name = a.trim();
    if (!name) return "Usage: /skill-merge <skill-name>";
    const VALID_SKILL_NAME = /^[a-zA-Z0-9_-]+$/;
    if (!VALID_SKILL_NAME.test(name)) return `Invalid skill name "${name}". Use only letters, numbers, hyphens, and underscores.`;
    const result = mergeSkill(name);
    if (result.hasConflicts) {
      return [
        `## Skill Merge: ${name}`,
        "",
        `❌ ${result.conflicts.length} conflict(s) found`,
        "",
        ...result.conflicts.map((c) => `- **Line ${c.line}**: ${c.context}`),
        "",
        `Use \`/skill-merge-resolve ${name} --pi\` or \`--user\` or \`--manual\`.`
      ].join("\n");
    }
    return `## Skill Merge: ${name}\n\n✅ Clean merge. ${result.state.autoResolved} lines auto-resolved.`;
  }) });

  pi.registerCommand("merge-list", { description: "List all skill merge states", handler: show((() => {
    const states = listMergeStates();
    if (!states.length) return "## Merge States\n\nNo merges recorded yet.";
    return [
      `## Merge States`,
      "",
      ...states.map((s) => `- **${s.name}**: ${s.conflictCount} conflicts, ${s.autoResolved} auto-resolved, ${s.manualRequired} manual — ${s.mergedAt}`),
    ].join("\n");
  })()) });

  registerCapture(pi);
  registerBridge(pi);
  registerTools(pi);

  // Record uncaught errors for telemetry
  process.on("uncaughtException", (err) => {
    telemetry.record("uncaught_exception", { error: err.message, name: err.name });
  });
  process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    telemetry.record("unhandled_rejection", { error: message });
  });

  // Record telemetry snapshot on shutdown
  pi.on("session_end" as any, async () => {
    telemetry.record("session_end", telemetry.snapshot() as unknown as Record<string, unknown>);
  });
}
