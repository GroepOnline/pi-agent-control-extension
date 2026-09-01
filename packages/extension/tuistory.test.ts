import { describe, expect, it, vi } from "vitest";
import { captureTuiStory } from "./tuistory.ts";

vi.mock("./utils.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils.ts")>();
  return { ...actual, rootDir: () => "/repo", shellEscape: (s: string) => `'${s}'` };
});

const TARGET = "my-tui-app --safe";
const DIR = "/tmp/evidence/run-001";
const ID = "evidence-abc123";
const TCTL = "/repo/bin/tctl";

describe("captureTuiStory runtime plans", () => {
  it("builds a real tctl cast launch with the command as the first launch argument", () => {
    const r = captureTuiStory(TARGET, "cast", DIR, ID);
    expect(r.commandParts?.[0]).toEqual([
      TCTL, "launch", TARGET, "-s", expect.stringContaining("evidence-abc123"),
      "--backend", "tuistory", "--env", "FORCE_COLOR=3", "--env", "COLORTERM=truecolor",
      "--record", `${DIR}/capture.cast`,
    ]);
    expect(r.expectedArtifacts).toEqual([`${DIR}/capture.cast`]);
    expect(r.validated).toBe(false);
  });
  it("captures png through tctl screenshot and cleans the session", () => {
    const r = captureTuiStory(TARGET, "png", DIR, ID);
    expect(r.commandParts?.[0]?.slice(0, 3)).toEqual([TCTL, "launch", TARGET]);
    expect(r.commandParts?.[1]).toEqual([
      TCTL, "-s", expect.stringContaining("evidence-abc123"), "screenshot", "-o", `${DIR}/screenshot.png`,
    ]);
    expect(r.expectedArtifacts).toEqual([`${DIR}/screenshot.png`]);
    expect(r.cleanupCommandParts?.[0]?.at(-1)).toBe("close");
  });

  it("writes report output from a real tctl snapshot", () => {
    const r = captureTuiStory(TARGET, "report", DIR, ID);
    expect(r.commandParts?.[1]).toEqual([
      TCTL, "-s", expect.stringContaining("evidence-abc123"), "snapshot", "--trim",
    ]);
    expect(r.outputArtifact).toBe(`${DIR}/report.txt`);
    expect(r.expectedArtifacts).toEqual([`${DIR}/report.txt`]);
  });

  it("converts asciicast to mp4 through agg and ffmpeg instead of a phantom cast2gif binary", () => {
    const r = captureTuiStory(TARGET, "mp4", DIR, ID);
    expect(r.commandParts?.some((step) => step[0] === "cast2gif")).toBe(false);
    expect(r.commandParts?.some((step) => step[0] === "agg")).toBe(true);
    expect(r.commandParts?.some((step) => step[0] === "ffmpeg")).toBe(true);
    expect(r.expectedArtifacts).toContain(`${DIR}/capture.mp4`);
  });
});
