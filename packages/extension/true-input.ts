import { join } from "node:path";
import type { CaptureFormat, CaptureResult } from "./capture.ts";
import { rootDir, shellEscape } from "./utils.ts";

function sessionName(evidenceId: string): string {
  return `capture-${evidenceId}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

export function captureTrueInput(
  target: string,
  format: CaptureFormat,
  evidenceDir: string,
  evidenceId: string,
): CaptureResult {
  const tctl = join(rootDir(), "bin", "tctl");
  const session = sessionName(evidenceId);
  const launch = [tctl, "launch", target, "-s", session, "--backend", "true-input"];
  const waitIdle = [tctl, "-s", session, "wait-idle", "--timeout", "1500"];
  const close = [tctl, "-s", session, "close"];
  const result: CaptureResult = {
    evidenceId, format, path: evidenceDir, validated: false, driver: "true-input",
    command: "", commandParts: [], cleanupCommandParts: [close],
    expectedArtifacts: [], supported: true, warnings: [],
  };
  const safeTctl = shellEscape(tctl);
  const safeTarget = shellEscape(target);
  switch (format) {
    case "mp4": {
      const mp4 = join(evidenceDir, "capture.mp4");
      result.commandParts = [[...launch, "--record", mp4]];
      result.expectedArtifacts = [mp4];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend true-input --record ${shellEscape(mp4)}`;
      break;
    }
    case "png": {
      const screenshot = join(evidenceDir, "screenshot.png");
      result.commandParts = [
        launch,
        waitIdle,
        [tctl, "-s", session, "screenshot", "-o", screenshot],
      ];
      result.expectedArtifacts = [screenshot];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend true-input && ${safeTctl} -s ${session} wait-idle --timeout 1500 && ${safeTctl} -s ${session} screenshot -o ${shellEscape(screenshot)}`;
      break;
    }
    case "report": {
      const report = join(evidenceDir, "report.txt");
      result.commandParts = [launch, waitIdle, [tctl, "-s", session, "snapshot", "--trim"]];
      result.outputArtifact = report;
      result.expectedArtifacts = [report];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend true-input && ${safeTctl} -s ${session} wait-idle --timeout 1500 && ${safeTctl} -s ${session} snapshot --trim`;
      break;
    }
    case "cast":
      result.supported = false;
      result.commandParts = [];
      result.cleanupCommandParts = [];
      result.command = "";
      result.warnings.push("asciicast is not supported by the true-input backend; use png, report, or mp4.");
      break;
  }

  return result;
}
