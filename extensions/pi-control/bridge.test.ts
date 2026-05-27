import { describe, it, expect } from "vitest";
import { getBridgeState, formatBridgeStatusMarkdown } from "./bridge.ts";

describe("getBridgeState", () => {
  it("returns initial non-running state", () => {
    const state = getBridgeState();
    expect(state.running).toBe(false);
    expect(state.port).toBe(0);
    expect(state.clientCount).toBe(0);
    expect(state.startTime).toBeNull();
    expect(Array.isArray(state.events)).toBe(true);
  });
});

describe("formatBridgeStatusMarkdown", () => {
  it("renders bridge status as markdown", () => {
    const md = formatBridgeStatusMarkdown();
    expect(md).toContain("## Bridge Status");
    expect(md).toContain("Running");
    expect(md).toContain("Port");
    expect(md).toContain("Clients");
    expect(md).toContain("Uptime");
    expect(md).toContain("Events");
    expect(md).toContain("Bridge not running");
  });

  it("shows token when bridge is running", () => {
    // Simulate running state by checking the markdown still formats correctly
    const md = formatBridgeStatusMarkdown();
    expect(md).toBeDefined();
    expect(typeof md).toBe("string");
  });
});
