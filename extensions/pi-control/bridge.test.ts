import { describe, it, expect } from "vitest";
import { getBridgeState, formatBridgeStatusMarkdown } from "./bridge.ts";

describe("getBridgeState", () => {
  it("returns initial non-running state", () => {
    const state = getBridgeState();
    expect(state.running).toBe(false);
    expect(state.port).toBe(0);
    expect(state.clients).toEqual([]);
    expect(state.startTime).toBeNull();
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
    expect(md).toContain("Bridge not running");
  });
});
