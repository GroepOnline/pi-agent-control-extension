import { join } from "node:path";
import type { CaptureResult, CaptureFormat } from "./capture.ts";

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

  const castPath = join(evidenceDir, "capture.cast");
  const snapshotPath = join(evidenceDir, "snapshot.txt");

  switch (format) {
    case "cast":
      result.command = `tctl launch "${target}" --backend tuistory --record ${castPath} --env FORCE_COLOR=3 --env COLORTERM=truecolor`;
      result.validated = true;
      break;
    case "mp4":
      result.command = `tctl launch "${target}" --backend tuistory --record ${castPath} && cast2gif ${castPath} ${join(evidenceDir, "capture.mp4")}`;
      break;
    case "png":
      result.command = `tctl launch "${target}" --backend tuistory --record ${castPath} && tctl snapshot --out ${snapshotPath}`;
      result.warnings.push("png for tuistory produces a text snapshot, not an image.");
      break;
    case "report":
      result.command = `tctl launch "${target}" --backend tuistory --record ${castPath}`;
      result.validated = true;
      break;
  }

  return result;
}
