import { describe, it, expect } from "vitest";
import { captureTuiStory } from "./tuistory.ts";

const TARGET = "my-tui-app";
const EVIDENCE_DIR = "/tmp/evidence/run-001";
const EVIDENCE_ID = "evidence-abc123";

describe("captureTuiStory", () => {
  describe("cast format", () => {
    it("returns driver 'tuistory'", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("tuistory");
    });

    it("sets validated to true", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds correct commandParts with color env vars", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["tctl", "launch", "--backend", "tuistory", "--record", `${EVIDENCE_DIR}/capture.cast`, "--env", "FORCE_COLOR=3", "--env", "COLORTERM=truecolor", "--", TARGET],
      ]);
    });

    it("includes FORCE_COLOR and COLORTERM in the command string", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("FORCE_COLOR=3");
      expect(r.command).toContain("COLORTERM=truecolor");
      expect(r.command).toContain("tuistory");
    });

    it("has empty warnings", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });

    it("preserves evidenceId and format", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.evidenceId).toBe(EVIDENCE_ID);
      expect(r.format).toBe("cast");
    });

    it("sets path to evidenceDir", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.path).toBe(EVIDENCE_DIR);
    });
  });

  describe("mp4 format", () => {
    it("returns driver 'tuistory'", () => {
      const r = captureTuiStory(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("tuistory");
    });

    it("sets validated to false", () => {
      const r = captureTuiStory(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("builds two-step commandParts: record then convert", () => {
      const r = captureTuiStory(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["tctl", "launch", "--backend", "tuistory", "--record", `${EVIDENCE_DIR}/capture.cast`, "--", TARGET],
        ["cast2gif", `${EVIDENCE_DIR}/capture.cast`, `${EVIDENCE_DIR}/capture.mp4`],
      ]);
    });

    it("joins two commands with && in the command string", () => {
      const r = captureTuiStory(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("&&");
      expect(r.command).toContain("tctl");
      expect(r.command).toContain("cast2gif");
      expect(r.command).toContain("capture.cast");
      expect(r.command).toContain("capture.mp4");
    });

    it("has empty warnings", () => {
      const r = captureTuiStory(TARGET, "mp4", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });
  });

  describe("png format", () => {
    it("returns driver 'tuistory'", () => {
      const r = captureTuiStory(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("tuistory");
    });

    it("sets validated to false", () => {
      const r = captureTuiStory(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(false);
    });

    it("builds two-step commandParts: record then snapshot", () => {
      const r = captureTuiStory(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["tctl", "launch", "--backend", "tuistory", "--record", `${EVIDENCE_DIR}/capture.cast`, "--", TARGET],
        ["tctl", "snapshot", "--out", `${EVIDENCE_DIR}/snapshot.txt`],
      ]);
    });

    it("joins two commands with && in the command string", () => {
      const r = captureTuiStory(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("&&");
      expect(r.command).toContain("snapshot");
      expect(r.command).toContain("snapshot.txt");
    });

    it("warns that png produces a text snapshot, not an image", () => {
      const r = captureTuiStory(TARGET, "png", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual(["png for tuistory produces a text snapshot, not an image."]);
    });
  });

  describe("report format", () => {
    it("returns driver 'tuistory'", () => {
      const r = captureTuiStory(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.driver).toBe("tuistory");
    });

    it("sets validated to true", () => {
      const r = captureTuiStory(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.validated).toBe(true);
    });

    it("builds single commandPart: tctl launch with recording", () => {
      const r = captureTuiStory(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.commandParts).toEqual([
        ["tctl", "launch", "--backend", "tuistory", "--record", `${EVIDENCE_DIR}/capture.cast`, "--", TARGET],
      ]);
    });

    it("produces a single command (no &&)", () => {
      const r = captureTuiStory(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).not.toContain("&&");
    });

    it("has empty warnings", () => {
      const r = captureTuiStory(TARGET, "report", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.warnings).toEqual([]);
    });
  });

  describe("common result fields across all formats", () => {
    it("always sets driver to tuistory", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTuiStory(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.driver).toBe("tuistory");
      }
    });

    it("always returns a non-empty command string", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTuiStory(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.command.length).toBeGreaterThan(0);
      }
    });

    it("always references tctl in the command", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTuiStory(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.command).toContain("tctl");
      }
    });

    it("always references tuistory backend", () => {
      const formats = ["mp4", "cast", "png", "report"] as const;
      for (const format of formats) {
        const r = captureTuiStory(TARGET, format, EVIDENCE_DIR, EVIDENCE_ID);
        expect(r.command).toContain("tuistory");
      }
    });

    it("preserves custom evidenceId", () => {
      const r = captureTuiStory(TARGET, "cast", EVIDENCE_DIR, "custom-id-789");
      expect(r.evidenceId).toBe("custom-id-789");
    });

    it("preserves custom evidenceDir as path", () => {
      const r = captureTuiStory(TARGET, "cast", "/custom/path", EVIDENCE_ID);
      expect(r.path).toBe("/custom/path");
    });
  });

  describe("shell escaping of target", () => {
    it("escapes target with shell metacharacters", () => {
      const r = captureTuiStory("my app & test", "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("'my app & test'");
    });

    it("does not wrap simple alphanumeric target in quotes", () => {
      const r = captureTuiStory("simple-app", "cast", EVIDENCE_DIR, EVIDENCE_ID);
      expect(r.command).toContain("simple-app");
      expect(r.command).not.toContain("'simple-app'");
    });

    it("escapes paths with spaces in evidenceDir", () => {
      const r = captureTuiStory(TARGET, "cast", "/tmp/my evidence/run", EVIDENCE_ID);
      expect(r.command).toContain("'/tmp/my evidence/run/capture.cast'");
    });
  });
});
