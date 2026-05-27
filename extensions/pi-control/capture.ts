import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { routeControlTask } from "./routing.ts";
import { captureBrowser } from "./browser.ts";
import { captureTuiStory } from "./tuistory.ts";
import { captureTrueInput } from "./true-input.ts";
import { validateEvidence } from "./control_evidence_schema.ts";
import { rootDir } from "./utils.ts";

export type CaptureFormat = "mp4" | "cast" | "png" | "report";

export interface CaptureResult {
  evidenceId: string;
  format: CaptureFormat;
  path: string;
  validated: boolean;
  driver: string;
  command: string;
  warnings: string[];
}

export function routeToDriver(target: string): { driver: string; warnings: string[] } {
  if (/^https?:\/\//i.test(target)) {
    return { driver: "agent-browser", warnings: [] };
  }
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
    if (isValidFormat(formatPart)) {
      format = formatPart;
    }
  }

  return { target: target.trim(), format };
}

export function capture(target: string, format: CaptureFormat = "mp4"): CaptureResult {
  const { driver, warnings } = routeToDriver(target);
  const evidenceId = `capture-${Date.now()}`;
  const evidenceDir = join(rootDir(), "artifacts", "runs", evidenceId, "evidence");
  mkdirSync(evidenceDir, { recursive: true });

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

  const validation = validateEvidence({
    evidenceId: result.evidenceId,
    format: result.format,
    path: result.path,
    driver: result.driver,
  });
  result.validated = validation.valid;

  return result;
}

export function formatCaptureMarkdown(result: CaptureResult): string {
  return [
    `## Capture Result`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| **Evidence ID** | ${result.evidenceId} |`,
    `| **Driver** | ${result.driver} |`,
    `| **Format** | ${result.format} |`,
    `| **Path** | ${result.path} |`,
    `| **Validated** | ${result.validated ? "✅" : "❌"} |`,
    `| **Command** | \`${result.command}\` |`,
    ...(result.warnings.length ? [`| **Warnings** | ${result.warnings.join("; ")} |`] : []),
  ].join("\n");
}

export function registerCapture(pi: ExtensionAPI) {
  pi.registerCommand("capture", {
    description: "Unified evidence capture: kiest driver + format automatisch",
    handler: async (args: string, ctx: ExtensionContext) => {
      const parsed = parseCaptureArgs(args);
      if (parsed.error) {
        ctx.ui?.notify?.("Usage: /capture <url|command> [--format mp4|cast|png|report]", "error");
        return;
      }

      const result = capture(parsed.target, parsed.format);
      ctx.ui?.notify?.(formatCaptureMarkdown(result), result.validated ? "info" : "warning");
    },
  });
}
