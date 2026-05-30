import type { CaptureResult, CaptureFormat } from "./capture.ts";
import { shellEscape } from "./utils.ts";

export function captureTuiStory(
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
    driver: "tuistory",
    command: "",
    warnings: [],
  };

  switch (format) {
    case "cast":
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", `${evidenceDir}/capture.cast`, "--env", "FORCE_COLOR=3", "--env", "COLORTERM=truecolor", "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.validated = true;
      break;
    case "mp4":
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", `${evidenceDir}/capture.cast`, "--", target],
        ["cast2gif", `${evidenceDir}/capture.cast`, `${evidenceDir}/capture.mp4`]
      ];
      result.command = result.commandParts.map(cmd => cmd.map(p => shellEscape(p)).join(" ")).join(" && ");
      break;
    case "png":
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", `${evidenceDir}/capture.cast`, "--", target],
        ["tctl", "snapshot", "--out", `${evidenceDir}/snapshot.txt`]
      ];
      result.command = result.commandParts.map(cmd => cmd.map(p => shellEscape(p)).join(" ")).join(" && ");
      result.warnings.push("png for tuistory produces a text snapshot, not an image.");
      break;
    case "report":
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", `${evidenceDir}/capture.cast`, "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.validated = true;
      break;
  }

  return result;
}
