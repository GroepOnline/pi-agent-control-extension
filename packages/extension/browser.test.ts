import { describe, expect, it, vi } from "vitest";
import { captureBrowser } from "./browser.ts";

vi.mock("./utils.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils.ts")>();
  return { ...actual, shellEscape: (s: string) => `'${s}'` };
});

const TARGET = "https://example.com/path?q=safe";
const DIR = "/tmp/evidence/run-001";
const ID = "evidence-abc123";

describe("captureBrowser runtime plans", () => {
  it("uses current agent-browser open/set viewport/screenshot commands", () => {
    const r = captureBrowser(TARGET, "png", DIR, ID);
    const session = expect.stringContaining("evidence-abc123");
    expect(r.commandParts).toEqual([
      ["agent-browser", "--session", session, "open", TARGET],
      ["agent-browser", "--session", session, "set", "viewport", "1280", "720"],
      ["agent-browser", "--session", session, "screenshot", `${DIR}/screenshot.png`],
    ]);
    expect(r.expectedArtifacts).toEqual([`${DIR}/screenshot.png`]);
    expect(r.cleanupCommandParts?.[0]?.at(-1)).toBe("close");
  });
  it("persists snapshot stdout as a report artifact", () => {
    const r = captureBrowser(TARGET, "report", DIR, ID);
    expect(r.commandParts?.at(-1)).toEqual([
      "agent-browser", "--session", expect.stringContaining("evidence-abc123"), "snapshot",
    ]);
    expect(r.outputArtifact).toBe(`${DIR}/report.txt`);
    expect(r.expectedArtifacts).toEqual([`${DIR}/report.txt`]);
  });

  it("records webm and converts it to mp4", () => {
    const r = captureBrowser(TARGET, "mp4", DIR, ID);
    expect(r.commandParts?.some((step) => step.includes("record") && step.includes("start"))).toBe(true);
    expect(r.commandParts?.some((step) => step.includes("record") && step.includes("stop"))).toBe(true);
    expect(r.commandParts?.some((step) => step[0] === "ffmpeg")).toBe(true);
    expect(r.expectedArtifacts).toContain(`${DIR}/recording.mp4`);
  });

  it("rejects asciicast instead of pretending browser open is cast evidence", () => {
    const r = captureBrowser(TARGET, "cast", DIR, ID);
    expect(r.supported).toBe(false);
    expect(r.commandParts).toEqual([]);
    expect(r.warnings.join(" ")).toContain("not supported");
  });

  it("never marks a plan as runtime validated before execution", () => {
    for (const format of ["png", "mp4", "report"] as const) {
      expect(captureBrowser(TARGET, format, DIR, ID).validated).toBe(false);
    }
  });
});
