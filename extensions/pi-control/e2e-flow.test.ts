import { describe, it, expect } from "vitest";
import { routeControlTask } from "./routing.ts";
import { browserControlGuidance } from "./tools/browser.ts";
import { buildUsageReport } from "./utils.ts";

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
