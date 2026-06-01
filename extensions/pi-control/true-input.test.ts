import { describe, it, expect } from "vitest";
import { captureTrueInput } from "./true-input.ts";

const TARGET = "my-tui-app";
const EVIDENCE_DIR = "/tmp/evidence/run-001";
const EVIDENCE_ID = "evidence-abc123";

describe("captureTrueInput", () => {
  describe("mp4 format", () => {
    it("returns driver 'true-input'", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("true-input");
    });

    it("sets validated to true", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds the correct commandParts", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["true-input", "record", "--out", `${EVIDENCE_DIR}/capture.mp4`, "--", TARGET],
      ]);
    });

    it("builds a non-empty command string", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("true-input");
      expect(r.command).toContain("record");
      expect(r.command).toContain(`${EVIDENCE_DIR}/capture.mp4`);
      expect(r.command).toContain(TARGET);
    });

    it("has empty warnings", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });

    it("preserves evidenceId and format", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.evidenceId).toBe(EVIDENCE_ID);
      expect(r.format).toBe("mp4");
    });

    it("sets path to evidenceDir", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.path).toBe(EVIDENCE_DIR);
    });
  });

  describe("cast format", () => {
    it("returns driver 'true-input'", () => {
      const r = captureTrueInput(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("true-input");
    });

    it("sets validated to true", () => {
      const r = captureTrueInput(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds correct commandParts with --asciicast flag", () => {
      const r = captureTrueInput(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["true-input", "record", "--asciicast", "--out", `${EVIDENCE_DIR}/capture.cast`, "--", TARGET],
      ]);
    });

    it("includes --asciicast in the command string", () => {
      const r = captureTrueInput(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("--asciicast");
      expect(r.command).toContain("capture.cast");
    });

    it("has empty warnings", () => {
      const r = captureTrueInput(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });
  });

  describe("png format", () => {
    it("returns driver 'true-input'", () => {
      const r = captureTrueInput(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("true-input");
    });

    it("sets validated to false", () => {
      const r = captureTrueInput(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("builds correct commandParts for screenshot", () => {
      const r = captureTrueInput(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["true-input", "screenshot", "--out", `${EVIDENCE_DIR}/screenshot.png`, "--", TARGET],
      ]);
    });

    it("includes screenshot in the command string", () => {
      const r = captureTrueInput(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("screenshot");
      expect(r.command).toContain("screenshot.png");
    });

    it("includes a warning about PTY screenshot", () => {
      const r = captureTrueInput(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual(["png for true-input produces a PTY screenshot."]);
    });
  });

  describe("report format", () => {
    it("returns driver 'true-input'", () => {
      const r = captureTrueInput(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("true-input");
    });

    it("sets validated to true", () => {
      const r = captureTrueInput(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds correct commandParts for log", () => {
      const r = captureTrueInput(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["true-input", "log", "--out", `${EVIDENCE_DIR}/log.txt`, "--", TARGET],
      ]);
    });

    it("includes log in the command string", () => {
      const r = captureTrueInput(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("log");
      expect(r.command).toContain("log.txt");
    });

    it("has empty warnings", () => {
      const r = captureTrueInput(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });
  });

  describe("common result fields across all formats", () => {
    it("always sets driver to true-input", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTrueInput(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.driver).toBe("true-input");
      }
    });

    it("always returns a non-empty command string", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTrueInput(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.command.length).toBeGreaterThan(0);
      }
    });

    it("always references true-input in the command", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTrueInput(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.command).toContain("true-input");
      }
    });

    it("preserves custom evidenceId", () => {
      const r = captureTrueInput(TARGET, "mp4", EVIDENCE_DIR, "custom-id-456");
      expect(r.evidenceId).toBe("custom-id-456");
    });

    it("preserves custom evidenceDir as path", () => {
      const r = captureTrueInput(TARGET, "mp4", "/custom/path", EVIDENCE_ID);
      expect(r.path).toBe("/custom/path");
    });
  });

  describe("shell escaping of target", () => {
    it("escapes target with shell metacharacters", () => {
      const r = captureTrueInput("my app & test", "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      // shellEscape wraps in single quotes when metacharacters are present
      expect(r.command).toContain("'my app & test'");
    });

    it("does not wrap simple alphanumeric target in quotes", () => {
      const r = captureTrueInput("simple-app", "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("simple-app");
      // should not have single-quoted version
      expect(r.command).not.toContain("'simple-app'");
    });
  });
});
