import { describe, expect, it, vi } from "vitest";
import { captureTrueInput } from "./true-input.ts";

vi.mock("./utils.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils.ts")>();
  return { ...actual, rootDir: () => "/repo", shellEscape: (s: string) => `'${s}'` };
});

const TARGET = "ghostty key encoding --safe";
const DIR = "/tmp/evidence/run-001";
const ID = "evidence-abc123";
const TCTL = "/repo/bin/tctl";

describe("captureTrueInput runtime plans", () => {
  it("uses the shipped tctl true-input backend for mp4 instead of a phantom true-input executable", () => {
    const r = captureTrueInput(TARGET, "mp4", DIR, ID);
    expect(r.commandParts?.[0]).toEqual([
      TCTL, "launch", TARGET, "-s", expect.stringContaining("evidence-abc123"),
      "--backend", "true-input", "--record", `${DIR}/capture.mp4`,
    ]);
    expect(r.expectedArtifacts).toEqual([`${DIR}/capture.mp4`]);
    expect(r.cleanupCommandParts?.[0]?.at(-1)).toBe("close");
  });
  it("captures a screenshot through the live tctl session", () => {
    const r = captureTrueInput(TARGET, "png", DIR, ID);
    expect(r.commandParts?.[1]).toEqual([
      TCTL, "-s", expect.stringContaining("evidence-abc123"), "wait-idle", "--timeout", "1500",
    ]);
    expect(r.commandParts?.[2]).toEqual([
      TCTL, "-s", expect.stringContaining("evidence-abc123"), "screenshot", "-o", `${DIR}/screenshot.png`,
    ]);
    expect(r.expectedArtifacts).toEqual([`${DIR}/screenshot.png`]);
  });

  it("writes a report from the tctl snapshot output", () => {
    const r = captureTrueInput(TARGET, "report", DIR, ID);
    expect(r.commandParts?.at(-1)).toEqual([
      TCTL, "-s", expect.stringContaining("evidence-abc123"), "snapshot", "--trim",
    ]);
    expect(r.outputArtifact).toBe(`${DIR}/report.txt`);
    expect(r.expectedArtifacts).toEqual([`${DIR}/report.txt`]);
  });

  it("rejects asciicast truthfully because the true-input backend does not produce it", () => {
    const r = captureTrueInput(TARGET, "cast", DIR, ID);
    expect(r.supported).toBe(false);
    expect(r.commandParts).toEqual([]);
    expect(r.warnings.join(" ")).toContain("not supported");
  });
});
