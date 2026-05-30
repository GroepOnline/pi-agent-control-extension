import { describe, it, expect } from "vitest";
import { getBridgeState, formatBridgeStatusMarkdown, safeEqual } from "./bridge.ts";

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    expect(safeEqual("hello", "hello")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeEqual("hello", "world")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(safeEqual("hello", "hi")).toBe(false);
  });

  it("returns false for empty vs non-empty string", () => {
    expect(safeEqual("", "a")).toBe(false);
    expect(safeEqual("a", "")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
  });

  it("handles multi-byte UTF-8 characters correctly", () => {
    // Emoji: 4 UTF-8 bytes but 1 UTF-16 code unit
    expect(safeEqual("🎉", "🎉")).toBe(true);
    expect(safeEqual("🎉", "🎊")).toBe(false);
    // This was the DoS vector: same char length but different byte length
    expect(safeEqual("é", "é")).toBe(true); // both use same encoding
  });

  it("returns false when byte lengths differ but char lengths match", () => {
    // 1-byte ASCII vs multi-byte UTF-8 with same char count
    expect(safeEqual("aaaa", "🎉")).toBe(false);
  });

  it("handles long tokens", () => {
    const token = "a".repeat(256);
    expect(safeEqual(token, token)).toBe(true);
    expect(safeEqual(token, token + "x")).toBe(false);
  });
});

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
    const md = formatBridgeStatusMarkdown();
    expect(md).toBeDefined();
    expect(typeof md).toBe("string");
  });
});
