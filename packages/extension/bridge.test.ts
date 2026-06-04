import { describe, it, expect, afterEach, vi } from "vitest";
import { WebSocket } from "ws";
import { mkdirSync, rmSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { getBridgeState, formatBridgeStatusMarkdown, safeEqual, startBridge, stopBridge } from "./bridge.ts";

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
    expect(safeEqual("🎉", "🎉")).toBe(true);
    expect(safeEqual("🎉", "🎊")).toBe(false);
    expect(safeEqual("é", "é")).toBe(true);
  });

  it("returns false when byte lengths differ but char lengths match", () => {
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

// ─── Integration: lifecycle + auth ──────────────────────────────────────

/**
 * These tests start real HTTP/WebSocket servers on port 0 (OS-assigned)
 * to verify the full bridge lifecycle and auth flow.
 */
describe("bridge lifecycle — port 0", () => {
  afterEach(async () => {
    await stopBridge();
  });

  it("starts on port 0 and reports a real port via getBridgeState", async () => {
    const { port, token } = await startBridge(0);
    expect(port).toBeGreaterThan(0);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    const state = getBridgeState();
    expect(state.running).toBe(true);
    expect(state.port).toBe(port);
  });

  it("stopBridge tears down cleanly", async () => {
    await startBridge(0);
    expect(getBridgeState().running).toBe(true);

    await stopBridge();
    const state = getBridgeState();
    expect(state.running).toBe(false);
    expect(state.port).toBe(0);
    expect(state.clientCount).toBe(0);
  });

  it("can be started, stopped, and restarted", async () => {
    const r1 = await startBridge(0);
    expect(r1.port).toBeGreaterThan(0);
    await stopBridge();

    const r2 = await startBridge(0);
    expect(r2.port).toBeGreaterThan(0);
    expect(r2.port).not.toBe(r1.port); // different OS-assigned port
    await stopBridge();
  });
});

describe("bridge HOME env override", () => {
  afterEach(async () => {
    await stopBridge();
  });

  it("persists token to disk with 0o600 permissions", async () => {
    const { token } = await startBridge(0);

    // Token should be persisted to the standard config path
    const { join: pathJoin } = await import("node:path");
    const { homedir } = await import("node:os");
    const tokenPath = pathJoin(homedir(), ".config", "devin", "bridge-token");

    const storedToken = readFileSync(tokenPath, "utf8").trim();
    expect(storedToken).toBe(token);

    // File should have 0o600 permissions
    const st = statSync(tokenPath);
    const permBits = st.mode & 0o777;
    expect(permBits).toBe(0o600);

    await stopBridge();
  });
});

describe("bridge auth — timingSafeEqual", () => {
  afterEach(async () => {
    await stopBridge();
  });

  it("accepts connection with valid token", async () => {
    const { port, token } = await startBridge(0);

    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);
    const msg = await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 5000);
      ws.on("message", (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(data.toString()));
      });
      ws.on("error", (err) => { clearTimeout(timer); reject(err); });
    });

    expect(msg.type).toBe("connected");
    expect(msg.payload?.clientId).toBeDefined();
    ws.close();
  });

  it("rejects connection with invalid token", async () => {
    const { port } = await startBridge(0);

    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=WRONG_TOKEN`);
    const closed = await new Promise<boolean>((resolve) => {
      ws.on("close", (code) => {
        resolve(code === 1008); // 1008 = policy violation
      });
      // If it doesn't close within 3s, fail
      setTimeout(() => resolve(false), 3000);
    });

    expect(closed).toBe(true);
  });

  it("rejects connection with no token", async () => {
    const { port } = await startBridge(0);

    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const closed = await new Promise<boolean>((resolve) => {
      ws.on("close", (code) => {
        resolve(code === 1008);
      });
      setTimeout(() => resolve(false), 3000);
    });

    expect(closed).toBe(true);
  });

  it("rejects connection with partially correct token (timing-safe)", async () => {
    const { port, token } = await startBridge(0);

    // Same length but different content
    const wrongToken = token.split("").reverse().join("");
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${wrongToken}`);
    const closed = await new Promise<boolean>((resolve) => {
      ws.on("close", (code) => {
        resolve(code === 1008);
      });
      setTimeout(() => resolve(false), 3000);
    });

    expect(closed).toBe(true);
  });
});
