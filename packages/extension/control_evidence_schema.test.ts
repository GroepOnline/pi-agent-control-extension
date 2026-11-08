import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateEvidence, EvidenceInput } from "./control_evidence_schema.ts";

describe("validateEvidence", () => {
  it("should validate a completely valid input", () => {
    const input: EvidenceInput = {
      evidenceId: "ev-123",
      format: "mp4",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    };
    const result = validateEvidence(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate all allowed formats", () => {
    const formats = ["cast", "mp4", "screenshots", "report", "png"];
    for (const format of formats) {
      const input: EvidenceInput = {
        evidenceId: "ev-123",
        format,
        path: "/path/to/evidence",
        driver: "tuistory"
      };
      const result = validateEvidence(input);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("should validate formats case-insensitively", () => {
    const input: EvidenceInput = {
      evidenceId: "ev-123",
      format: "MP4",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    };
    const result = validateEvidence(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return error if evidenceId is missing", () => {
    const input = {
      format: "mp4",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    } as EvidenceInput;
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("evidenceId must be at least 3 characters");
  });

  it("should return error if evidenceId is less than 3 characters", () => {
    const input: EvidenceInput = {
      evidenceId: "ab",
      format: "mp4",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    };
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("evidenceId must be at least 3 characters");
  });

  it("should return error if format is missing without throwing", () => {
    const input = {
      evidenceId: "ev-123",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    } as EvidenceInput;
    expect(() => validateEvidence(input)).not.toThrow();
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("format is required");
  });

  it("should return error for empty string format", () => {
    const input = {
      evidenceId: "ev-123",
      format: "",
      path: "/path/to/evidence.mp4",
      driver: "tuistory"
    } as EvidenceInput;
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("format is required");
  });

  it("should return error if path is missing", () => {
    const input = {
      evidenceId: "ev-123",
      format: "mp4",
      driver: "tuistory"
    } as EvidenceInput;
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("path is required");
  });

  it("should return error if driver is missing", () => {
    const input = {
      evidenceId: "ev-123",
      format: "mp4",
      path: "/path/to/evidence.mp4"
    } as EvidenceInput;
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("driver is required");
  });

  it("should return error if format is not in allowed formats list", () => {
    const input: EvidenceInput = {
      evidenceId: "ev-123",
      format: "avi",
      path: "/path/to/evidence.avi",
      driver: "tuistory"
    };
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("format 'avi' is not a recognized evidence format");
  });

  it("should collect multiple errors", () => {
    const input = {
      evidenceId: "a",
      format: "avi",
      driver: "tuistory"
    } as EvidenceInput;
    const result = validateEvidence(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain("evidenceId must be at least 3 characters");
    expect(result.errors).toContain("path is required");
    expect(result.errors).toContain("format 'avi' is not a recognized evidence format");
  });
  it("requires real non-empty artifacts when runtime validation is requested", () => {
    const dir = mkdtempSync(join(tmpdir(), "control-evidence-"));
    const missing = join(dir, "missing.png");
    const result = validateEvidence({
      evidenceId: "ev-runtime",
      format: "png",
      path: dir,
      driver: "agent-browser",
      artifactPaths: [missing],
      requireArtifacts: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("does not exist");
  });

  it("rejects zero-byte and symlink evidence and returns hashes for real artifacts", () => {
    const dir = mkdtempSync(join(tmpdir(), "control-evidence-"));
    const empty = join(dir, "empty.png");
    writeFileSync(empty, "");
    const emptyResult = validateEvidence({
      evidenceId: "ev-empty", format: "png", path: dir, driver: "agent-browser",
      artifactPaths: [empty], requireArtifacts: true,
    });
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.errors.join(" ")).toContain("empty");

    const real = join(dir, "real.png");
    writeFileSync(real, "png-bytes");
    const link = join(dir, "link.png");
    symlinkSync(real, link);
    const linkResult = validateEvidence({
      evidenceId: "ev-link", format: "png", path: dir, driver: "agent-browser",
      artifactPaths: [link], requireArtifacts: true,
    });
    expect(linkResult.valid).toBe(false);
    expect(linkResult.errors.join(" ")).toContain("symbolic link");

    const realResult = validateEvidence({
      evidenceId: "ev-real", format: "png", path: dir, driver: "agent-browser",
      artifactPaths: [real], requireArtifacts: true,
    });
    expect(realResult.valid).toBe(true);
    expect(realResult.artifacts).toHaveLength(1);
    expect(realResult.artifacts?.[0]?.size).toBeGreaterThan(0);
    expect(realResult.artifacts?.[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

});
