import { EVIDENCE_SCHEMA } from "./schema.ts";

export { EVIDENCE_SCHEMA };

export interface EvidenceInput {
  evidenceId: string;
  format: string;
  path: string;
  driver: string;
}

export function validateEvidence(input: EvidenceInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.evidenceId || input.evidenceId.length < 3) {
    errors.push("evidenceId must be at least 3 characters");
  }
  if (!input.format) {
    errors.push("format is required");
  }
  if (!input.path) {
    errors.push("path is required");
  }
  if (!input.driver) {
    errors.push("driver is required");
  }

  const schemaLower = EVIDENCE_SCHEMA.toLowerCase();
  const formatLower = input.format.toLowerCase();
  const allowedFormats = ["cast", "mp4", "screenshots", "report", "png"];
  if (!allowedFormats.includes(formatLower)) {
    errors.push(`format '${input.format}' is not a recognized evidence format`);
  } else if (!schemaLower.includes(formatLower) && formatLower !== "report") {
    errors.push(`format '${input.format}' is not mentioned in evidence schema`);
  }

  return { valid: errors.length === 0, errors };
}
