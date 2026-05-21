import { describe, it, expect } from "vitest";
import { BROWSER_CONTROL_STATUS, browserControlGuidance } from "./browser.ts";

describe("Browser Control Tool", () => {
  describe("BROWSER_CONTROL_STATUS", () => {
    it("should export correct status configuration", () => {
      expect(BROWSER_CONTROL_STATUS).toEqual({
        implemented: true,
        driver: "agent-browser",
        runtime: "Playwright (via agent-browser CLI)",
        capabilities: ["navigation", "snapshot", "interaction", "screenshot", "recording"],
      });
    });
  });

  describe("browserControlGuidance", () => {
    it("should return guidance instructions as a string", () => {
      const guidance = browserControlGuidance();
      expect(typeof guidance).toBe("string");
    });

    it("should contain all best practice rules", () => {
      const guidance = browserControlGuidance();
      const lines = guidance.split("\n");

      expect(lines.length).toBe(6);
      expect(lines[0]).toBe("### Browser Control Best Practices");
      expect(lines[1]).toMatch(/^1\. \*\*Route First\*\*/);
      expect(lines[2]).toMatch(/^2\. \*\*Loop Flow\*\*/);
      expect(lines[3]).toMatch(/^3\. \*\*Ref Stability\*\*/);
      expect(lines[4]).toMatch(/^4\. \*\*Visual Proof\*\*/);
      expect(lines[5]).toMatch(/^5\. \*\*Clean Up\*\*/);
    });
  });
});
