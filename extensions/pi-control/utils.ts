import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyCommitments } from "./recipes.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_CURRENCY = "USD";

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

export function rootDir() {
  const candidates = [
    PACKAGE_ROOT,
    ...(existsSync(join(PACKAGE_ROOT, "package.json")) ? [] : [process.cwd()]),
  ];
  for (const d of candidates) {
    if (existsSync(join(d, "package.json"))) return d;
  }
  return PACKAGE_ROOT;
}

export function listSkills(base: string) {
  const dir = join(base, "skills");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "SKILL.md")))
    .map((d) => {
      const text = readFileSync(join(dir, d.name, "SKILL.md"), "utf8");
      return { name: d.name, description: (text.match(/^description:\s*(.+)$/m)?.[1] ?? "").replace(/^['"]|['"]$/g, "") };
    });
}

export function runValidator(root: string) {
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

export function buildUsageReport(input: UsageInput = {}) {
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
