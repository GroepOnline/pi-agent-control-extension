import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureBrowser } from "./browser.ts";

const { mockExecFileSync } = vi.hoisted(() => ({
  mockExecFileSync: vi.fn(),
}));
vi.mock("node:child_process", () => ({
  execFileSync: mockExecFileSync,
}));

vi.mock("../../core/utils.ts", () => ({
  shellEscape: vi.fn((s: string) => s),
}));

const TARGET = "https://example.com";
const EVIDENCE_DIR = "/tmp/evidence/run-001";
const EVIDENCE_ID = "evidence-abc123";

describe("captureBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("png format", () => {
    it("returns driver 'agent-browser'", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("agent-browser");
    });

    it("sets validated to true when agent-browser is installed", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("sets validated to false when agent-browser is not installed", () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("not found");
      });
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("adds a warning when agent-browser is not found", () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("not found");
      });
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([
        "agent-browser CLI not found in PATH. Install it to execute browser captures.",
      ]);
    });

    it("has empty warnings when agent-browser is found", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });

    it("builds the correct command string", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toBe(
        `agent-browser open --viewport 1280x720 -- ${TARGET} && agent-browser screenshot --out ${EVIDENCE_DIR}/screenshot.png`,
      );
    });

    it("has correct commandParts structure with two steps", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["agent-browser", "open", "--viewport", "1280x720", "--", TARGET],
        ["agent-browser", "screenshot", "--out", `${EVIDENCE_DIR}/screenshot.png`],
      ]);
    });

    it("calls execFileSync to check for agent-browser installation", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(mockExecFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/^(which|where)$/),
        ["agent-browser"],
        expect.objectContaining({
          encoding: "utf8",
          timeout: 5000,
        }),
      );
    });

    it("preserves evidenceId and format", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.evidenceId).toBe(EVIDENCE_ID);
      expect(r.format).toBe("png");
    });

    it("sets path to evidenceDir", () => {
      mockExecFileSync.mockReturnValue("/usr/bin/agent-browser");
      const r = captureBrowser(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.path).toBe(EVIDENCE_DIR);
    });
  });

  describe("mp4 format", () => {
    it("returns driver 'agent-browser'", () => {
      const r = captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("agent-browser");
    });

    it("sets validated to false", () => {
      const r = captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("builds the correct command string", () => {
      const r = captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toBe(
        `agent-browser open --viewport 1280x720 -- ${TARGET} && agent-browser record --out ${EVIDENCE_DIR}/recording.mp4`,
      );
    });

    it("has empty warnings", () => {
      const r = captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });

    it("has correct commandParts structure with two steps", () => {
      const r = captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["agent-browser", "open", "--viewport", "1280x720", "--", TARGET],
        ["agent-browser", "record", "--out", `${EVIDENCE_DIR}/recording.mp4`],
      ]);
    });

    it("does not call execFileSync", () => {
      captureBrowser(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });
  });

  describe("cast format", () => {
    it("returns driver 'agent-browser'", () => {
      const r = captureBrowser(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("agent-browser");
    });

    it("sets validated to false", () => {
      const r = captureBrowser(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("builds the correct command string", () => {
      const r = captureBrowser(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toBe(
        `agent-browser open --viewport 1280x720 -- ${TARGET}`,
      );
    });

    it("includes a warning about unsupported asciicast format", () => {
      const r = captureBrowser(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([
        "asciicast format is not supported for browser captures; use mp4 or png.",
      ]);
    });

    it("has correct commandParts structure with one step", () => {
      const r = captureBrowser(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["agent-browser", "open", "--viewport", "1280x720", "--", TARGET],
      ]);
    });
  });

  describe("report format", () => {
    it("returns driver 'agent-browser'", () => {
      const r = captureBrowser(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("agent-browser");
    });

    it("sets validated to true", () => {
      const r = captureBrowser(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds the correct command string", () => {
      const r = captureBrowser(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toBe(
        `agent-browser open --viewport 1280x720 -- ${TARGET} && agent-browser snapshot`,
      );
    });

    it("has empty warnings", () => {
      const r = captureBrowser(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });

    it("has correct commandParts structure with two steps", () => {
      const r = captureBrowser(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["agent-browser", "open", "--viewport", "1280x720", "--", TARGET],
        ["agent-browser", "snapshot"],
      ]);
    });
  });
});
