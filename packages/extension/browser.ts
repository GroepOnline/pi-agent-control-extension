import { join } from "node:path";
import type { CaptureFormat, CaptureResult } from "./capture.ts";
import { shellEscape } from "./utils.ts";

function sessionName(evidenceId: string): string {
  return `capture-${evidenceId}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

function browserStep(session: string, ...args: string[]): string[] {
  return ["agent-browser", "--session", session, ...args];
}

export function captureBrowser(
  target: string,
  format: CaptureFormat,
  evidenceDir: string,
  evidenceId: string,
): CaptureResult {
  const session = sessionName(evidenceId);
  const result: CaptureResult = {
    evidenceId,
    format,
    path: evidenceDir,
    validated: false,
    driver: "agent-browser",
    command: "",
    commandParts: [],
    cleanupCommandParts: [browserStep(session, "close")],
    expectedArtifacts: [],
    supported: true,
    warnings: [],
  };
  const open = browserStep(session, "open", target);
  const viewport = browserStep(session, "set", "viewport", "1280", "720");
  const safeTarget = shellEscape(target);

  switch (format) {
    case "png": {
      const out = join(evidenceDir, "screenshot.png");
      result.commandParts = [open, viewport, browserStep(session, "screenshot", out)];
      result.expectedArtifacts = [out];
      result.command = `agent-browser --session ${session} open ${safeTarget} && agent-browser --session ${session} set viewport 1280 720 && agent-browser --session ${session} screenshot ${shellEscape(out)}`;
      break;
    }
    case "report": {
      const out = join(evidenceDir, "report.txt");
      result.commandParts = [open, viewport, browserStep(session, "snapshot")];
      result.outputArtifact = out;
      result.expectedArtifacts = [out];
      result.command = `agent-browser --session ${session} open ${safeTarget} && agent-browser --session ${session} set viewport 1280 720 && agent-browser --session ${session} snapshot`;
      break;
    }
    case "mp4": {
      const webm = join(evidenceDir, "recording.webm");
      const mp4 = join(evidenceDir, "recording.mp4");
      result.commandParts = [
        open,
        viewport,
        browserStep(session, "record", "start", webm),
        browserStep(session, "wait", "1000"),
        browserStep(session, "record", "stop"),
        ["ffmpeg", "-y", "-i", webm, "-movflags", "+faststart", "-pix_fmt", "yuv420p", mp4],
      ];
      result.expectedArtifacts = [webm, mp4];
      result.command = `agent-browser --session ${session} open ${safeTarget} && agent-browser --session ${session} record start ${shellEscape(webm)} && agent-browser --session ${session} wait 1000 && agent-browser --session ${session} record stop && ffmpeg -y -i ${shellEscape(webm)} ${shellEscape(mp4)}`;
      break;
    }
    case "cast":
      result.supported = false;
      result.commandParts = [];
      result.cleanupCommandParts = [];
      result.command = "";
      result.warnings.push("asciicast is not supported for browser captures; use png, report, or mp4.");
      break;
  }

  return result;
}
