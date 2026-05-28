import { join } from "node:path";
import type { CaptureResult, CaptureFormat } from "./capture.ts";

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

  switch (format) {
    case "mp4":
      result.command = `true-input record --out ${join(evidenceDir, "capture.mp4")} -- ${target}`;
      result.validated = true;
      break;
    case "cast":
      result.command = `true-input record --asciicast --out ${join(evidenceDir, "capture.cast")} -- ${target}`;
      result.validated = true;
      break;
    case "png":
      result.command = `true-input screenshot --out ${join(evidenceDir, "screenshot.png")} -- ${target}`;
      result.warnings.push("png for true-input produces a PTY screenshot.");
      break;
    case "report":
      result.command = `true-input log --out ${join(evidenceDir, "log.txt")} -- ${target}`;
      result.validated = true;
      break;
  }

  return result;
}
