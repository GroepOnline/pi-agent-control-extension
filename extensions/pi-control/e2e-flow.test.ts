import { describe, it, expect } from "vitest";
import { routeControlTask } from "./routing.ts";
import { browserControlGuidance } from "./tools/browser.ts";
import { buildUsageReport } from "./utils.ts";
import { capture, parseCaptureArgs, formatCaptureMarkdown, routeToDriver } from "./capture.ts";
import { validateEvidence } from "./control_evidence_schema.ts";

describe("E2E: Route → Browser → Evidence Flow", () => {
  it("routes tasks to an appropriate driver based on intent", () => {
    const route = routeControlTask("open a website and click a button");
    // Should route to a valid driver
    expect(["agent-browser", "tuistory", "true-input"]).toContain(route.driver);
    expect(route.deliverable).toBeTruthy();
    expect(route.skills.length).toBeGreaterThan(0);
  });

  it("provides browser guidance after routing", () => {
    const route = routeControlTask("fill out a form on a web page");
    expect(route.driver).toBe("agent-browser");

    const guidance = browserControlGuidance();
    expect(guidance).toContain("Route First");
    expect(guidance).toContain("Loop Flow");
  });

  it("generates usage report with cost estimate", () => {
    const report = buildUsageReport({
      model: "gpt-4o",
      promptTokens: 50000,
      completionTokens: 20000,
      inputCostPerMillion: 5,
      outputCostPerMillion: 15,
    });
    expect(report.text).toContain("Usage & Observability");
    expect(report.details.estimatedTotalCost).toBeGreaterThan(0);
  });

  it("includes guardrails for all routing decisions", () => {
    const route = routeControlTask("delete all data from the database via web UI");
    expect(route.deliverable).toBeTruthy();
    expect(Array.isArray(route.recipe)).toBe(true);
    expect(route.recipe.length).toBeGreaterThan(0);
  });
});

describe("E2E: Capture → Evidence → Validation Flow", () => {
  it("routes a URL to agent-browser driver", () => {
    const decision = routeToDriver("https://example.com");
    expect(decision.driver).toBe("agent-browser");
  });

  it("captures a URL and validates evidence", () => {
    const result = capture("https://example.com", "png");
    expect(result.driver).toBe("agent-browser");
    expect(result.evidenceId).toMatch(/^capture-\d+$/);

    const validation = validateEvidence({
      evidenceId: result.evidenceId,
      format: result.format,
      path: result.path,
      driver: result.driver,
    });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rejects invalid evidence input during validation", () => {
    const validation = validateEvidence({
      evidenceId: "x",
      format: "exe",
      path: "",
      driver: "",
    });
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some((e) => e.includes("evidenceId"))).toBe(true);
    expect(validation.errors.some((e) => e.includes("format"))).toBe(true);
  });

  it("formats capture result as markdown", () => {
    const result = capture("https://example.com", "report");
    const md = formatCaptureMarkdown(result);
    expect(md).toContain("Capture Result");
    expect(md).toContain(result.evidenceId);
    expect(md).toContain("agent-browser");
  });

  it("parses capture args with format flag", () => {
    const parsed = parseCaptureArgs("https://example.com --format png");
    expect(parsed.target).toBe("https://example.com");
    expect(parsed.format).toBe("png");
    expect(parsed.error).toBeUndefined();
  });

  it("returns error for empty capture args", () => {
    const parsed = parseCaptureArgs("   ");
    expect(parsed.error).toBe("No target provided");
  });

  it("handles unknown format gracefully", () => {
    const parsed = parseCaptureArgs("cmd --format exe");
    expect(parsed.format).toBe("mp4");
    expect(parsed.target).toBe("cmd");
  });
});
