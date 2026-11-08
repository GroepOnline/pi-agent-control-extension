import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, openSync, readSync } from "node:fs";
import { resolve, sep } from "node:path";
import { EVIDENCE_SCHEMA } from "./schema.ts";

export { EVIDENCE_SCHEMA };

export interface EvidenceInput {
  evidenceId: string;
  format: string;
  path: string;
  driver: string;
  artifactPaths?: string[];
  requireArtifacts?: boolean;
}

export interface EvidenceArtifact {
  path: string;
  size: number;
  sha256: string;
}

export interface EvidenceValidationResult {
  valid: boolean;
  errors: string[];
  artifacts: EvidenceArtifact[];
}
function sha256File(path: string): string {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  const buffer = Buffer.allocUnsafe(64 * 1024);
  try {
    for (;;) {
      const bytesRead = readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}

function isInsideEvidenceRoot(root: string, candidate: string): boolean {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(resolvedRoot + sep);
}

export function validateEvidence(input: EvidenceInput): EvidenceValidationResult {
  const errors: string[] = [];
  const artifacts: EvidenceArtifact[] = [];
  if (!input.evidenceId || input.evidenceId.length < 3) {
    errors.push("evidenceId must be at least 3 characters");
  }
  if (!input.format) errors.push("format is required");
  if (!input.path) errors.push("path is required");
  if (!input.driver) errors.push("driver is required");

  const schemaLower = EVIDENCE_SCHEMA.toLowerCase();
  if (input.format) {
    const formatLower = input.format.toLowerCase();
    const allowedFormats = ["cast", "mp4", "screenshots", "report", "png"];
    if (!allowedFormats.includes(formatLower)) {
      errors.push(`format '${input.format}' is not a recognized evidence format`);
    } else if (!schemaLower.includes(formatLower) && formatLower !== "report") {
      errors.push(`format '${input.format}' is not mentioned in evidence schema`);
    }
  }

  if (input.requireArtifacts) {
    const artifactPaths = input.artifactPaths ?? [];
    if (!artifactPaths.length) {
      errors.push("runtime evidence requires at least one artifact path");
    }

    for (const artifactPath of artifactPaths) {
      if (!input.path || !isInsideEvidenceRoot(input.path, artifactPath)) {
        errors.push(`artifact '${artifactPath}' escapes evidence root`);
        continue;
      }
      if (!existsSync(artifactPath)) {
        errors.push(`artifact '${artifactPath}' does not exist`);
        continue;
      }
      const stat = lstatSync(artifactPath);
      if (stat.isSymbolicLink()) {
        errors.push(`artifact '${artifactPath}' is a symbolic link`);
        continue;
      }
      if (!stat.isFile()) {
        errors.push(`artifact '${artifactPath}' is not a regular file`);
        continue;
      }
      if (stat.size <= 0) {
        errors.push(`artifact '${artifactPath}' is empty`);
        continue;
      }
      artifacts.push({ path: artifactPath, size: stat.size, sha256: sha256File(artifactPath) });
    }
  }

  return { valid: errors.length === 0, errors, artifacts };
}
