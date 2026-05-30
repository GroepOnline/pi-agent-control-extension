import { describe, it, expect } from "vitest";
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
});
