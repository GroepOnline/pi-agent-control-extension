import type { CaptureResult, CaptureFormat } from "../../core/capture/capture.ts";
import { join } from "node:path";
import { shellEscape } from "../../core/utils.ts";

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
    case "mp4": {
      const out = join(evidenceDir, "capture.mp4");
      result.command = `true-input record --out ${shellEscape(out)} -- ${safeTarget}`;
      result.commandParts = [["true-input", "record", "--out", out, "--", target]];
      result.validated = true;
      break;
    }
    case "cast": {
      const out = join(evidenceDir, "capture.cast");
      result.command = `true-input record --asciicast --out ${shellEscape(out)} -- ${safeTarget}`;
      result.commandParts = [["true-input", "record", "--asciicast", "--out", out, "--", target]];
      result.validated = true;
      break;
    }
    case "png": {
      const out = join(evidenceDir, "screenshot.png");
      result.command = `true-input screenshot --out ${shellEscape(out)} -- ${safeTarget}`;
      result.commandParts = [["true-input", "screenshot", "--out", out, "--", target]];
      result.warnings.push("png for true-input produces a PTY screenshot.");
      break;
    }
    case "report": {
      const out = join(evidenceDir, "log.txt");
      result.command = `true-input log --out ${shellEscape(out)} -- ${safeTarget}`;
      result.commandParts = [["true-input", "log", "--out", out, "--", target]];
      result.validated = true;
      break;
    }
  }

  return result;
}
