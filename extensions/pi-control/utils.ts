import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyCommitments } from "./recipes.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_CURRENCY = "USD";

/**
 * POSIX shell escaping: wraps in single quotes and escapes any embedded single quotes.
 * Safe for use in command strings that will be interpreted by a shell.
 */
export function shellEscape(arg: string, platform?: string): string {
  const plat = platform ?? process.platform;
  if (plat === "win32") {
    if (/^[a-zA-Z0-9_/:.@\\-]+$/.test(arg)) return arg;
    return '"' + arg.replace(/([&|<>^%])/g, "^$1") + '"';
  }
  if (/^[a-zA-Z0-9_/:.@-]+$/.test(arg)) return arg;
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export type UsageInput = {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  cachedInputTokens?: number;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  currency?: string;
};

export type ParallelReport = {
  name: string;
  markdown: string;
  evidence?: string[];
};

// ⚡ Bolt Optimization: Memoize rootDir to avoid redundant, synchronous filesystem checks in hot paths.
let cachedRootDir: string | null = null;

export function rootDir() {
  if (cachedRootDir) return cachedRootDir;
  const candidates = [
    PACKAGE_ROOT,
    ...(existsSync(join(PACKAGE_ROOT, "package.json")) ? [] : [process.cwd()]),
  ];
  for (const d of candidates) {
    if (existsSync(join(d, "package.json"))) {
      cachedRootDir = d;
      return d;
    }
  }
  cachedRootDir = PACKAGE_ROOT;
  return PACKAGE_ROOT;
}

// ⚡ Bolt Optimization: Memoize the loaded skill inventory per base directory.
// This prevents 17+ blocking readFileSync calls every time the skill index is checked.
const cachedSkills = new Map<string, { name: string; description: string }[]>();

export function clearSkillsCache() {
  cachedSkills.clear();
  cachedRootDir = null;
}

export function listSkills(base: string) {
  if (cachedSkills.has(base)) return cachedSkills.get(base)!;
  const dir = join(base, "skills");
  if (!existsSync(dir)) {
    cachedSkills.set(base, []);
    return [];
  }
  const skills = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    try {
      const text = readFileSync(join(dir, d.name, "SKILL.md"), "utf8");
      skills.push({ name: d.name, description: (text.match(/^description:\s*(.+)$/m)?.[1] ?? "").replace(/^['"]|['"]$/g, "") });
    } catch {
      // Ignore directories without SKILL.md
    }
  }
  cachedSkills.set(base, skills);
  return skills;
}

// SECURITY: Uses PACKAGE_ROOT directly (no parameter injection possible)
export function runValidator() {
  const script = join(PACKAGE_ROOT, "scripts", "validate-package.py");
  if (!existsSync(script)) return "scripts/validate-package.py not found.";
  const cmds: [string, string[]][] = process.platform === "win32"
    ? [["py", ["-3", script]], ["python", [script]], ["python3", [script]]]
    : [["python3", [script]], ["python", [script]]];
  for (const [cmd, args] of cmds) {
    try { return execFileSync(cmd, args, { cwd: PACKAGE_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }).trim(); }
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

export function buildUsageReport(input: UsageInput = {}) {
  const {
    promptTokens = 0,
    completionTokens = 0,
    cachedInputTokens = 0,
    inputCostPerMillion = 0,
    outputCostPerMillion = 0,
  } = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, finiteNumber(v)]));
  const billableInputTokens = Math.max(promptTokens - cachedInputTokens, 0);
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

export function buildParallelVerifyReport(reports: ParallelReport[]) {
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
