import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { routeControlTask } from "./routing.ts";
import { captureBrowser } from "./browser.ts";
import { captureTuiStory } from "./tuistory.ts";
import { captureTrueInput } from "./true-input.ts";
import { validateEvidence, type EvidenceArtifact } from "./control_evidence_schema.ts";
import { rootDir } from "./utils.ts";

export type CaptureFormat = "mp4" | "cast" | "png" | "report";

export interface CaptureResult {
  evidenceId: string;
  format: CaptureFormat;
  path: string;
  validated: boolean;
  structurallyValid?: boolean;
  driver: string;
  command: string;
  commandParts?: string[][];
  cleanupCommandParts?: string[][];
  expectedArtifacts?: string[];
  outputArtifact?: string;
  supported?: boolean;
  executed?: boolean;
  success?: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  validationErrors?: string[];
  artifacts?: EvidenceArtifact[];
  warnings: string[];
}

export interface CaptureExecutionOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

type StepResult = { stdout: string; stderr: string };

export function routeToDriver(target: string): { driver: string; warnings: string[] } {
  if (/^https?:\/\//i.test(target)) return { driver: "agent-browser", warnings: [] };
  const decision = routeControlTask(target);
  return { driver: decision.driver, warnings: decision.warnings };
}

function isValidFormat(f: string): f is CaptureFormat {
  return ["mp4", "cast", "png", "report"].includes(f);
}
export function parseCaptureArgs(args: string): { target: string; format: CaptureFormat; error?: string } {
  const trimmed = args.trim();
  if (!trimmed) return { target: "", format: "mp4", error: "No target provided" };

  const formatIdx = trimmed.indexOf(" --format ");
  let target = trimmed;
  let format: CaptureFormat = "mp4";
  if (formatIdx !== -1) {
    target = trimmed.slice(0, formatIdx);
    const formatPart = trimmed.slice(formatIdx + " --format ".length).split(/\s+/)[0];
    if (isValidFormat(formatPart)) format = formatPart;
  }
  return { target: target.trim(), format };
}

function runStep(parts: string[], options: CaptureExecutionOptions): Promise<StepResult> {
  const [binary, ...args] = parts;
  if (!binary) return Promise.reject(new Error("capture command step has no executable"));
  return new Promise((resolve, reject) => {
    execFile(binary, args, {
      encoding: "utf8",
      timeout: options.timeoutMs ?? 120_000,
      cwd: options.cwd,
      env: options.env ? { ...process.env, ...options.env } : undefined,
      maxBuffer: 2 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout: stdout ?? "", stderr: stderr ?? "" }));
        return;
      }
      resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? error);
  }
  return String(error);
}

async function runCleanup(parts: string[][] | undefined, options: CaptureExecutionOptions): Promise<string[]> {
  const warnings: string[] = [];
  for (const step of parts ?? []) {
    try {
      await runStep(step, { ...options, timeoutMs: Math.min(options.timeoutMs ?? 15_000, 15_000) });
    } catch (error) {
      warnings.push(`cleanup failed: ${errorText(error)}`);
    }
  }
  return warnings;
}
export function capture(target: string, format: CaptureFormat = "mp4"): CaptureResult {
  const { driver, warnings } = routeToDriver(target);
  const evidenceId = `capture-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const evidenceDir = join(rootDir(), "artifacts", "runs", evidenceId, "evidence");
  try { mkdirSync(evidenceDir, { recursive: true }); } catch { /* best effort */ }

  let result: CaptureResult;
  switch (driver) {
    case "agent-browser":
      result = captureBrowser(target, format, evidenceDir, evidenceId);
      break;
    case "true-input":
      result = captureTrueInput(target, format, evidenceDir, evidenceId);
      break;
    case "tuistory":
    case "mixed":
    default:
      result = captureTuiStory(target, format, evidenceDir, evidenceId);
      break;
  }

  result.warnings = [...warnings, ...result.warnings];
  const structural = validateEvidence({
    evidenceId: result.evidenceId,
    format: result.format,
    path: result.path,
    driver: result.driver,
  });
  result.structurallyValid = structural.valid;
  result.validationErrors = structural.errors;
  result.validated = false;
  result.executed = false;
  return result;
}

export async function executeCapturePlan(
  plan: CaptureResult,
  options: CaptureExecutionOptions = {},
): Promise<CaptureResult> {
  const result: CaptureResult = {
    ...plan,
    warnings: [...plan.warnings],
    validationErrors: [...(plan.validationErrors ?? [])],
    artifacts: [],
    executed: false,
    success: false,
    validated: false,
  };

  if (result.supported === false) {
    result.error = result.warnings[0] ?? "capture format is not supported by this driver";
    return result;
  }
  if (result.structurallyValid === false) {
    result.error = result.validationErrors?.join("; ") || "capture plan is structurally invalid";
    return result;
  }
  const commandParts = result.commandParts ?? [];
  if (!commandParts.length) {
    result.error = "capture plan has no executable command steps";
    return result;
  }

  const stdout: string[] = [];
  const stderr: string[] = [];
  let commandError: unknown = null;
  try {
    result.executed = true;
    for (const step of commandParts) {
      const stepResult = await runStep(step, options);
      stdout.push(stepResult.stdout);
      stderr.push(stepResult.stderr);
    }
    if (result.outputArtifact) {
      writeFileSync(result.outputArtifact, stdout.at(-1) ?? "", { encoding: "utf8" });
    }
  } catch (error) {
    commandError = error;
    const e = error as { stdout?: string; stderr?: string };
    if (e.stdout) stdout.push(e.stdout);
    if (e.stderr) stderr.push(e.stderr);
  } finally {
    result.warnings.push(...await runCleanup(result.cleanupCommandParts, options));
  }

  result.stdout = stdout.filter(Boolean).join("\n");
  result.stderr = stderr.filter(Boolean).join("\n");
  if (commandError) {
    result.error = errorText(commandError);
    result.success = false;
    result.validated = false;
    return result;
  }

  const runtimeValidation = validateEvidence({
    evidenceId: result.evidenceId,
    format: result.format,
    path: result.path,
    driver: result.driver,
    artifactPaths: result.expectedArtifacts,
    requireArtifacts: true,
  });
  result.validationErrors = runtimeValidation.errors;
  result.artifacts = runtimeValidation.artifacts;
  result.validated = runtimeValidation.valid;
  result.success = runtimeValidation.valid;
  if (!runtimeValidation.valid) result.error = runtimeValidation.errors.join("; ");
  return result;
}

export async function executeCapture(
  target: string,
  format: CaptureFormat = "mp4",
  options: CaptureExecutionOptions = {},
): Promise<CaptureResult> {
  return executeCapturePlan(capture(target, format), options);
}
export function formatCaptureMarkdown(result: CaptureResult): string {
  const artifactText = result.artifacts?.length
    ? result.artifacts.map((a) => `${a.path} (${a.size} bytes, sha256 ${a.sha256.slice(0, 12)}…)`).join("<br>")
    : "none";
  return [
    "## Capture Result",
    "",
    "| Field | Value |",
    "|---|---|",
    `| **Evidence ID** | ${result.evidenceId} |`,
    `| **Driver** | ${result.driver} |`,
    `| **Format** | ${result.format} |`,
    `| **Path** | ${result.path} |`,
    `| **Structurally valid** | ${result.structurallyValid === false ? "❌" : "✅"} |`,
    `| **Executed** | ${result.executed ? "✅" : "❌"} |`,
    `| **Success** | ${result.success ? "✅" : "❌"} |`,
    `| **Evidence validated** | ${result.validated ? "✅" : "❌"} |`,
    `| **Artifacts** | ${artifactText} |`,
    `| **Command** | \`${result.command}\` |`,
    ...(result.error ? [`| **Error** | ${result.error} |`] : []),
    ...(result.warnings.length ? [`| **Warnings** | ${result.warnings.join("; ")} |`] : []),
  ].join("\n");
}

export function registerCapture(pi: ExtensionAPI) {
  pi.registerCommand("capture", {
    description: "Unified evidence capture: executes the routed driver and validates produced artifacts",
    handler: async (args: string, ctx: ExtensionContext) => {
      const parsed = parseCaptureArgs(args);
      if (parsed.error) {
        ctx.ui?.notify?.("Usage: /capture <url|command> [--format mp4|cast|png|report]", "error");
        return;
      }
      const result = await executeCapture(parsed.target, parsed.format);
      ctx.ui?.notify?.(formatCaptureMarkdown(result), result.success ? "info" : "warning");
    },
  });
}
