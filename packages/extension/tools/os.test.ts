import { describe, it, expect } from "vitest";
import { OS_CONTROL_STATUS, osControlGuidance } from "./os.ts";

describe("OS Control Tool", () => {
  describe("OS_CONTROL_STATUS", () => {
    it("should export correct status configuration", () => {
      expect(OS_CONTROL_STATUS).toEqual({
        implemented: false,
        driver: "os-control",
        target: "X11/Wayland + native input injection (cage/wtype)",
        capabilities: ["window-management", "keyboard-injection", "mouse-injection", "display-capture"],
        eta: "Q3 2026",
      });
    });
  });

  describe("osControlGuidance", () => {
    it("should return guidance instructions as a string", () => {
      const guidance = osControlGuidance();
      expect(typeof guidance).toBe("string");
    });

    it("should mention cage and wtype", () => {
      const guidance = osControlGuidance();
      expect(guidance).toContain("cage");
      expect(guidance).toContain("wtype");
    });

    it("should note the experimental status", () => {
      const guidance = osControlGuidance();
      expect(guidance).toContain("prototype");
    });
  });
});
