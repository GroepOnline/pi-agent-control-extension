import { join } from "node:path";
import type { CaptureResult, CaptureFormat } from "./capture.ts";
import { shellEscape } from "./utils.ts";

export function captureTrueInput(
  target: string,
  format: CaptureFormat,
  evidenceDir: string,
  evidenceId: string,
): CaptureResult {
  const result: CaptureResult = {
    evidenceId,
    format,
    path: evidenceDir,
    validated: false,
    driver: "true-input",
    command: "",
    warnings: [],
  };

  const safeTarget = shellEscape(target);
  const safeOut = shellEscape(evidenceDir);

  switch (format) {
    case "mp4":
      result.command = `true-input record --out ${safeOut}/capture.mp4 -- ${safeTarget}`;
      result.validated = true;
      break;
    case "cast":
      result.command = `true-input record --asciicast --out ${safeOut}/capture.cast -- ${safeTarget}`;
      result.validated = true;
      break;
    case "png":
      result.command = `true-input screenshot --out ${safeOut}/screenshot.png -- ${safeTarget}`;
      result.warnings.push("png for true-input produces a PTY screenshot.");
      break;
    case "report":
      result.command = `true-input log --out ${safeOut}/log.txt -- ${safeTarget}`;
      result.validated = true;
      break;
  }

  return result;
}
