import { join } from "node:path";
import type { CaptureFormat, CaptureResult } from "./capture.ts";
import { rootDir, shellEscape } from "./utils.ts";

function sessionName(evidenceId: string): string {
  return `capture-${evidenceId}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

export function captureTuiStory(
  target: string,
  format: CaptureFormat,
  evidenceDir: string,
  evidenceId: string,
): CaptureResult {
  const tctl = join(rootDir(), "bin", "tctl");
  const session = sessionName(evidenceId);
  const baseLaunch = [
    tctl, "launch", target, "-s", session, "--backend", "tuistory",
    "--env", "FORCE_COLOR=3", "--env", "COLORTERM=truecolor",
  ];
  const close = [tctl, "-s", session, "close"];
  const result: CaptureResult = {
    evidenceId, format, path: evidenceDir, validated: false, driver: "tuistory",
    command: "", commandParts: [], cleanupCommandParts: [close],
    expectedArtifacts: [], supported: true, warnings: [],
  };
  const safeTarget = shellEscape(target);
  const safeTctl = shellEscape(tctl);

  switch (format) {
    case "cast": {
      const cast = join(evidenceDir, "capture.cast");
      result.commandParts = [[...baseLaunch, "--record", cast]];
      result.expectedArtifacts = [cast];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend tuistory --record ${shellEscape(cast)} --env FORCE_COLOR=3 --env COLORTERM=truecolor`;
      break;
    }
    case "png": {
      const screenshot = join(evidenceDir, "screenshot.png");
      result.commandParts = [baseLaunch, [tctl, "-s", session, "screenshot", "-o", screenshot]];
      result.expectedArtifacts = [screenshot];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend tuistory && ${safeTctl} -s ${session} screenshot -o ${shellEscape(screenshot)}`;
      break;
    }
    case "report": {
      const report = join(evidenceDir, "report.txt");
      result.commandParts = [baseLaunch, [tctl, "-s", session, "snapshot", "--trim"]];
      result.outputArtifact = report;
      result.expectedArtifacts = [report];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend tuistory && ${safeTctl} -s ${session} snapshot --trim`;
      break;
    }
    case "mp4": {
      const cast = join(evidenceDir, "capture.cast");
      const gif = join(evidenceDir, "capture.gif");
      const mp4 = join(evidenceDir, "capture.mp4");
      result.commandParts = [
        [...baseLaunch, "--record", cast],
        ["agg", cast, gif],
        ["ffmpeg", "-y", "-i", gif, "-movflags", "+faststart", "-pix_fmt", "yuv420p", mp4],
      ];
      result.expectedArtifacts = [cast, mp4];
      result.command = `${safeTctl} launch ${safeTarget} -s ${session} --backend tuistory --record ${shellEscape(cast)} && agg ${shellEscape(cast)} ${shellEscape(gif)} && ffmpeg -y -i ${shellEscape(gif)} ${shellEscape(mp4)}`;
      break;
    }
  }

  return result;
}
