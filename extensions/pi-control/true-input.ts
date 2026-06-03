import type { CaptureResult, CaptureFormat } from "./capture.ts";
import { join } from "node:path";
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

  switch (format) {
    case "mp4":
      result.command = `true-input record --out ${shellEscape(join(evidenceDir, "capture.mp4"))} -- ${safeTarget}`;
      result.validated = true;
      break;
    case "cast":
      result.command = `true-input record --asciicast --out ${shellEscape(join(evidenceDir, "capture.cast"))} -- ${safeTarget}`;
      result.validated = true;
      break;
    case "png":
      result.command = `true-input screenshot --out ${shellEscape(join(evidenceDir, "screenshot.png"))} -- ${safeTarget}`;
      result.warnings.push("png for true-input produces a PTY screenshot.");
      break;
    case "report":
      result.command = `true-input log --out ${shellEscape(join(evidenceDir, "log.txt"))} -- ${safeTarget}`;
      result.validated = true;
      break;
  }

  return result;
}
