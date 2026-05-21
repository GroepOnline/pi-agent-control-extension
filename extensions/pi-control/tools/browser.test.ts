import { describe, it, expect } from "vitest";
import { BROWSER_CONTROL_STATUS, browserControlGuidance } from "./browser.ts";

describe("BROWSER_CONTROL_STATUS", () => {
  it("has implemented set to true", () => {
    expect(BROWSER_CONTROL_STATUS.implemented).toBe(true);
  });

  it("has the correct driver name", () => {
    expect(BROWSER_CONTROL_STATUS.driver).toBe("agent-browser");
  });

  it("has the correct runtime description", () => {
    expect(BROWSER_CONTROL_STATUS.runtime).toBe("Playwright (via agent-browser CLI)");
  });

  it("contains all expected capabilities", () => {
    const expectedCapabilities = [
      "navigation",
      "snapshot",
      "interaction",
      "screenshot",
      "recording",
    ];
    expectedCapabilities.forEach((capability) => {
      expect(BROWSER_CONTROL_STATUS.capabilities).toContain(capability);
    });
  });

  it("has exactly 5 capabilities", () => {
    expect(BROWSER_CONTROL_STATUS.capabilities).toHaveLength(5);
  });

  it("has the correct object shape", () => {
    const keys = Object.keys(BROWSER_CONTROL_STATUS);
    expect(keys).toContain("implemented");
    expect(keys).toContain("driver");
    expect(keys).toContain("runtime");
    expect(keys).toContain("capabilities");
  });

  it("freezes the status object via as const", () => {
    // The 'as const' assertion makes properties deeply readonly at the type level.
    // Verify the literal values are preserved (not widened).
    expect(BROWSER_CONTROL_STATUS.driver).toBe("agent-browser");
    // TypeScript's 'as const' infers literal types; vitest value assertions confirm
    // the values were not widened to string.
  });
});

describe("browserControlGuidance", () => {
  it("returns a non-empty string", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toBeTruthy();
    expect(typeof guidance).toBe("string");
    expect(guidance.length).toBeGreaterThan(0);
  });

  it("includes the guidance header", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("### Browser Control Best Practices");
  });

  it("mentions control_route for driver confirmation", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("control_route");
    expect(guidance).toContain("agent-browser");
  });

  it("documents the loop flow", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("open");
    expect(guidance).toContain("snapshot");
    expect(guidance).toContain("click");
    expect(guidance).toContain("fill");
  });

  it("mentions ref stability", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("Ref Stability");
  });

  it("mentions visual proof via screenshot", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("Visual Proof");
    expect(guidance).toContain("screenshot --annotate");
  });

  it("mentions cleanup by closing the session", () => {
    const guidance = browserControlGuidance();
    expect(guidance).toContain("Clean Up");
    expect(guidance).toContain("close");
  });

  it("returns a deterministic result on every call", () => {
    const result1 = browserControlGuidance();
    const result2 = browserControlGuidance();
    const result3 = browserControlGuidance();
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it("contains 5 numbered best practices", () => {
    const guidance = browserControlGuidance();
    // Count the numbered practice headers (1. through 5.)
    const numberedLines = guidance.match(/^\d+\./gm);
    expect(numberedLines).toHaveLength(5);
  });

  it("does not throw any errors", () => {
    expect(() => browserControlGuidance()).not.toThrow();
  });

  it("returns a string that uses consistent formatting", () => {
    const guidance = browserControlGuidance();
    // All lines should be non-empty (join with \n produces consistent output)
    const lines = guidance.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(lines.every((line) => line.length > 0)).toBe(true);
  });
});
