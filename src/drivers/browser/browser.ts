import { execFileSync } from "node:child_process";
import { join } from "node:path";
import type { CaptureResult, CaptureFormat } from "../../core/capture/capture.ts";
import { shellEscape } from "../../core/utils.ts";

export const BROWSER_CONTROL_STATUS = {
  implemented: true,
  driver: "agent-browser",
  runtime: "Playwright (via agent-browser CLI)",
  capabilities: ["navigation", "snapshot", "interaction", "screenshot", "recording"],
} as const;

export function browserControlGuidance() {
  return [
    "### Browser Control Best Practices",
    "1. **Route First**: Use `control_route` to confirm `agent-browser` is the correct driver.",
    "2. **Loop Flow**: `open` -> `snapshot` -> `action` (click/fill) -> `snapshot` (repeat).",
    "3. **Ref Stability**: DOM elements change; always re-snapshot after any navigation or modal change.",
    "4. **Visual Proof**: Use `screenshot --annotate` to tie visual evidence to interaction refs.",
    "5. **Clean Up**: Always call `close` at the end of a session to release resources.",
  ].join("\n");
}

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
      result.command = `agent-browser open --viewport 1280x720 -- ${shellEscape(target)} && agent-browser screenshot --out ${shellEscape(out)}`;
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "screenshot", "--out", out],
      ];
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
      result.command = `agent-browser open --viewport 1280x720 -- ${shellEscape(target)} && agent-browser record --out ${shellEscape(out)}`;
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "record", "--out", out],
      ];
      break;
    }
    case "cast": {
      result.command = `agent-browser open --viewport 1280x720 -- ${shellEscape(target)}`;
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
      ];
      result.warnings.push("asciicast format is not supported for browser captures; use mp4 or png.");
      break;
    }
    case "report": {
      result.command = `agent-browser open --viewport 1280x720 -- ${shellEscape(target)} && agent-browser snapshot`;
      result.commandParts = [
        ["agent-browser", "open", "--viewport", "1280x720", "--", target],
        ["agent-browser", "snapshot"],
      ];
      result.validated = true;
      break;
    }
  }

  return result;
}
