import { execFileSync } from "node:child_process";
import type { CaptureResult, CaptureFormat } from "./capture.ts";
import { shellEscape } from "./utils.ts";

export function captureBrowser(
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
    driver: "agent-browser",
    command: "",
    warnings: [],
  };

  const lookupCmd = process.platform === "win32" ? "where" : "which";

  switch (format) {
    case "png":
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "screenshot", "--out", `${evidenceDir}/screenshot.png`]
      ];
      result.command = result.commandParts.map(cmd => cmd.map(p => shellEscape(p)).join(" ")).join(" && ");
      try {
        execFileSync(lookupCmd, ["agent-browser"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000 });
        result.validated = true;
      } catch {
        result.warnings.push("agent-browser CLI not found in PATH. Install it to execute browser captures.");
      }
      break;
    case "mp4":
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "record", "--out", `${evidenceDir}/recording.mp4`]
      ];
      result.command = result.commandParts.map(cmd => cmd.map(p => shellEscape(p)).join(" ")).join(" && ");
      break;
    case "cast":
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target]
      ];
      result.command = result.commandParts[0].map(p => shellEscape(p)).join(" ");
      result.warnings.push("asciicast format is not supported for browser captures; use mp4 or png.");
      break;
    case "report":
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "snapshot"]
      ];
      result.command = result.commandParts.map(cmd => cmd.map(p => shellEscape(p)).join(" ")).join(" && ");
      result.validated = true;
      break;
  }

  return result;
}
