import { join } from "node:path";
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

  const safeTarget = shellEscape(target);
  const safeDir = shellEscape(evidenceDir);
  const castPath = `${safeDir}/capture.cast`;
  const snapshotPath = `${safeDir}/snapshot.txt`;

  switch (format) {
    case "cast":
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} --env FORCE_COLOR=3 --env COLORTERM=truecolor`;
      result.validated = true;
      break;
    case "mp4":
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} && cast2gif ${castPath} ${safeDir}/capture.mp4`;
      break;
    case "png":
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath} && tctl snapshot --out ${snapshotPath}`;
      result.warnings.push("png for tuistory produces a text snapshot, not an image.");
      break;
    case "report":
      result.command = `tctl launch ${safeTarget} --backend tuistory --record ${castPath}`;
      result.validated = true;
      break;
  }

  return result;
}
