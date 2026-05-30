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

  switch (format) {
    case "mp4":
      result.commandParts = [
        ["true-input", "record", "--out", `${evidenceDir}/capture.mp4`, "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.validated = true;
      break;
    case "cast":
      result.commandParts = [
        ["true-input", "record", "--asciicast", "--out", `${evidenceDir}/capture.cast`, "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.validated = true;
      break;
    case "png":
      result.commandParts = [
        ["true-input", "screenshot", "--out", `${evidenceDir}/screenshot.png`, "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.warnings.push("png for true-input produces a PTY screenshot.");
      break;
    case "report":
      result.commandParts = [
        ["true-input", "log", "--out", `${evidenceDir}/log.txt`, "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.validated = true;
      break;
  }

  return result;
}
