import { describe, it, expect } from "vitest";
import { buildUsageReport, buildParallelVerifyReport } from "./utils.ts";

describe("buildUsageReport", () => {
  it("returns default text when no input given", () => {
    const result = buildUsageReport();
    expect(result.text).toContain("# Usage & Observability");
    expect(result.details.model).toBeNull();
  });

  it("reports missing tokens message when no counters supplied", () => {
    const result = buildUsageReport();
    expect(result.text).toContain("No token counters were supplied");
  });

  it("computes costs correctly with sample input", () => {
    const result = buildUsageReport({
      model: "gpt-4o",
      promptTokens: 1000000,
      completionTokens: 500000,
      inputCostPerMillion: 5,
      outputCostPerMillion: 15,
    });
    expect(result.details.estimatedInputCost).toBe(5);
    expect(result.details.estimatedOutputCost).toBe(7.5);
    expect(result.details.estimatedTotalCost).toBe(12.5);
  });

  it("handles cached input tokens correctly", () => {
    const result = buildUsageReport({
      promptTokens: 1000000,
      cachedInputTokens: 400000,
      inputCostPerMillion: 5,
      outputCostPerMillion: 15,
    });
    expect(result.details.billableInputTokens).toBe(600000);
  });

  it("handles zero costs gracefully", () => {
    const result = buildUsageReport({
      promptTokens: 0,
      completionTokens: 0,
    });
    expect(result.details.estimatedTotalCost).toBe(0);
  });

  it("supports custom currency", () => {
    const result = buildUsageReport({
      promptTokens: 1000,
      completionTokens: 500,
      currency: "EUR",
    });
    expect(result.text).toContain("EUR");
  });

  it("handles undefined optional fields", () => {
    const result = buildUsageReport({
      model: "claude-4",
      completionTokens: 100,
    });
    expect(result.details.model).toBe("claude-4");
    expect(result.details.promptTokens).toBe(0);
  });
});

describe("buildParallelVerifyReport", () => {
  it("returns no reports message when empty", () => {
    const result = buildParallelVerifyReport([]);
    expect(result.text).toContain("No reports supplied");
    expect(result.details.ok).toBe(false);
  });

  it("checks a single valid report", () => {
    const result = buildParallelVerifyReport([
      {
        name: "test-report",
        markdown: "# Test\n\n## Technical\nstuff\n\n## Commitments\nstuff\n\n## Evidence\nsnapshot\n\n## Result\nPASS",
      },
    ]);
    expect(result.details.ok).toBe(true);
    expect(result.details.reports[0].name).toBe("test-report");
    expect(result.details.reports[0].ok).toBe(true);
  });

  it("checks a single invalid report", () => {
    const result = buildParallelVerifyReport([
      {
        name: "bad-report",
        markdown: "# Incomplete\n\nNo sections here.",
      },
    ]);
    expect(result.details.ok).toBe(false);
    expect(result.details.reports[0].ok).toBe(false);
  });

  it("handles multiple reports with mixed results", () => {
    const result = buildParallelVerifyReport([
      {
        name: "good",
        markdown: "# Good\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
      },
      {
        name: "bad",
        markdown: "# Bad\n\nNothing here.",
      },
    ]);
    expect(result.details.ok).toBe(false);
    expect(result.details.reports[0].ok).toBe(true);
    expect(result.details.reports[1].ok).toBe(false);
  });

  it("includes evidence paths in output", () => {
    const result = buildParallelVerifyReport([
      {
        name: "with-evidence",
        markdown: "# Test\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
        evidence: ["evidence/step1.png", "evidence/step2.png"],
      },
    ]);
    expect(result.text).toContain("evidence/step1.png");
    expect(result.text).toContain("evidence/step2.png");
  });

  it("handles reports with no evidence array", () => {
    const result = buildParallelVerifyReport([
      {
        name: "no-evidence",
        markdown: "# Test\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
      },
    ]);
    expect(result.details.reports[0].evidence).toEqual([]);
  });
});
