import type { CaptureResult, CaptureFormat } from "./capture.ts";
import { join } from "node:path";
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

  const safeTarget = shellEscape(target);
  const castPath = shellEscape(join(evidenceDir, "capture.cast"));
  const snapshotPath = shellEscape(join(evidenceDir, "snapshot.txt"));
  const mp4Path = shellEscape(join(evidenceDir, "capture.mp4"));

  switch (format) {
    case "cast": {
      const castFile = join(evidenceDir, "capture.cast");
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} --env FORCE_COLOR=3 --env COLORTERM=truecolor`;
      result.commandParts = [["tctl", "launch", "--backend", "tuistory", "--record", castFile, "--env", "FORCE_COLOR=3", "--env", "COLORTERM=truecolor", "--", target]];
      result.validated = true;
      break;
    }
    case "mp4": {
      const castFile = join(evidenceDir, "capture.cast");
      const mp4File = join(evidenceDir, "capture.mp4");
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} && cast2gif ${castPath} ${mp4Path}`;
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", castFile, "--", target],
        ["cast2gif", castFile, mp4File],
      ];
      break;
    }
    case "png": {
      const castFile = join(evidenceDir, "capture.cast");
      const snapshotFile = join(evidenceDir, "snapshot.txt");
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} && tctl snapshot --out ${snapshotPath}`;
      result.commandParts = [
        ["tctl", "launch", "--backend", "tuistory", "--record", castFile, "--", target],
        ["tctl", "snapshot", "--out", snapshotFile],
      ];
      result.warnings.push("png for tuistory produces a text snapshot, not an image.");
      break;
    }
    case "report": {
      const castFile = join(evidenceDir, "capture.cast");
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath}`;
      result.commandParts = [["tctl", "launch", "--backend", "tuistory", "--record", castFile, "--", target]];
      result.validated = true;
      break;
    }
  }

  return result;
}
