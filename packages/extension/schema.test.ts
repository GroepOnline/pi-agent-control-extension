import { describe, it, expect } from "vitest";
import { SKILL_NAMES, EVIDENCE_SCHEMA } from "./schema.ts";

describe("Control Schema", () => {
  describe("SKILL_NAMES", () => {
    it("should be an array of unique strings", () => {
      const uniqueSkills = new Set(SKILL_NAMES);
      expect(uniqueSkills.size).toBe(SKILL_NAMES.length);
    });

    it("should contain expected core skills", () => {
      const expectedSkills = [
        "agent-browser",
        "tuistory",
        "true-input",
        "capture",
        "verify",
      ];
      expectedSkills.forEach((skill) => {
        expect(SKILL_NAMES).toContain(skill);
      });
    });
  });

  describe("EVIDENCE_SCHEMA", () => {
    it("should contain the correct markdown title", () => {
      expect(EVIDENCE_SCHEMA).toContain("# Evidence Schema");
    });

    it("should document the run directory structure", () => {
      expect(EVIDENCE_SCHEMA).toContain("- run.json:");
      expect(EVIDENCE_SCHEMA).toContain("- transcript.md:");
      expect(EVIDENCE_SCHEMA).toContain("- evidence/:");
      expect(EVIDENCE_SCHEMA).toContain("- verification.md:");
    });

    it("should include a valid JSON example for minimum proof item", () => {
      expect(EVIDENCE_SCHEMA).toContain("\`\`\`json");
      expect(EVIDENCE_SCHEMA).toContain('"claim":');
      expect(EVIDENCE_SCHEMA).toContain('"step":');
      expect(EVIDENCE_SCHEMA).toContain('"driver":');
      expect(EVIDENCE_SCHEMA).toContain('"evidence":');
      expect(EVIDENCE_SCHEMA).toContain('"result":');
      expect(EVIDENCE_SCHEMA).toContain('"reason":');
    });
  });
});
