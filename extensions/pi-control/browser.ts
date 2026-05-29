import { execFileSync } from "node:child_process";
import { join } from "node:path";
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

  const isWin32 = process.platform === "win32";
  const lookUp = isWin32 ? "where" : "which";

  switch (format) {
    case "png": {
      const out = join(evidenceDir, "screenshot.png");
      result.command = `agent-browser open ${shellEscape(target)} --viewport 1280x720 && agent-browser screenshot --out ${shellEscape(out)}`;
      try {
        execFileSync(lookUp, ["agent-browser"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000 });
        result.validated = true;
      } catch {
        result.warnings.push("agent-browser CLI not found in PATH. Install it to execute browser captures.");
      }
      break;
    }
    case "mp4": {
      const out = join(evidenceDir, "recording.mp4");
      result.command = `agent-browser open ${shellEscape(target)} --viewport 1280x720 && agent-browser record --out ${shellEscape(out)}`;
      break;
    }
    case "cast":
      result.command = `agent-browser open ${shellEscape(target)} --viewport 1280x720`;
      result.warnings.push("asciicast format is not supported for browser captures; use mp4 or png.");
      break;
    case "report":
      result.command = `agent-browser open ${shellEscape(target)} --viewport 1280x720 && agent-browser snapshot`;
      result.validated = true;
      break;
  }

  return result;
}
