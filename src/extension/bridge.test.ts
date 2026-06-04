import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { WebSocket } from "ws";
import { mkdirSync, rmSync, mkdtempSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { getBridgeState, formatBridgeStatusMarkdown, safeEqual, startBridge, stopBridge } from "./bridge.ts";

// Hoisted mock for homedir — default returns real path; HOME override tests swap it
const mockHomedir = vi.hoisted(() => vi.fn());
vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  // Default: return the real homedir so BRIDGE_TOKEN_PATH is correct for most tests
  mockHomedir.mockReturnValue(actual.homedir());
  return { ...actual, homedir: mockHomedir };
});

// ─── safeEqual ─────────────────────────────────────────────────────────────

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

// ─── getBridgeState ────────────────────────────────────────────────────────

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

// ─── formatBridgeStatusMarkdown ────────────────────────────────────────────

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

// ─── Lifecycle: port 0 ─────────────────────────────────────────────────────

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

  it("startBridge is idempotent — concurrent calls return same promise", async () => {
    const p1 = startBridge(0);
    const p2 = startBridge(0);
    const r1 = await p1;
    const r2 = await p2;
    expect(r1.port).toBe(r2.port);
    expect(r1.token).toBe(r2.token);
    await stopBridge();
  });
});

// ─── HOME env override + token file 0o600 ──────────────────────────────────
//
// BRIDGE_TOKEN_PATH is a module-level const computed at load time via homedir().
// To test a different HOME, we must reset the module registry, point the hoisted
// mock at the temp directory, then dynamically import a fresh bridge module.

describe("bridge HOME env override", () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "bridge-home-test-"));
  });

  afterEach(async () => {
    // Restore default homedir for subsequent tests
    const os = await import("node:os");
    mockHomedir.mockReturnValue(os.homedir());
    vi.resetModules();
    try { rmSync(tempHome, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it("persists token to custom HOME path with 0o600 permissions", async () => {
    mockHomedir.mockReturnValue(tempHome);
    vi.resetModules();
    const bridge = await import("./bridge.ts");

    try {
      const { port, token } = await bridge.startBridge(0);
      expect(port).toBeGreaterThan(0);

      const tokenPath = join(tempHome, ".config", "devin", "bridge-token");
      expect(existsSync(tokenPath)).toBe(true);

      const storedToken = readFileSync(tokenPath, "utf8").trim();
      expect(storedToken).toBe(token);

      const st = statSync(tokenPath);
      const permBits = st.mode & 0o777;
      expect(permBits).toBe(0o600);
    } finally {
      await bridge.stopBridge();
    }
  });

  it("reuses existing token from custom HOME path", async () => {
    // Pre-seed a token file in the custom HOME
    const tokenDir = join(tempHome, ".config", "devin");
    mkdirSync(tokenDir, { recursive: true });
    const preExistingToken = randomUUID();
    writeFileSync(join(tokenDir, "bridge-token"), preExistingToken, { mode: 0o600 });

    mockHomedir.mockReturnValue(tempHome);
    vi.resetModules();
    const bridge = await import("./bridge.ts");

    try {
      const { token } = await bridge.startBridge(0);
      expect(token).toBe(preExistingToken);
    } finally {
      await bridge.stopBridge();
    }
  });

  it("creates parent directories when token path does not exist", async () => {
    mockHomedir.mockReturnValue(tempHome);
    vi.resetModules();
    const bridge = await import("./bridge.ts");

    try {
      const { token } = await bridge.startBridge(0);
      const tokenPath = join(tempHome, ".config", "devin", "bridge-token");
      expect(existsSync(tokenPath)).toBe(true);
      expect(readFileSync(tokenPath, "utf8").trim()).toBe(token);
    } finally {
      await bridge.stopBridge();
    }
  });

  it("token file 0o600 is enforced on pre-existing file with wrong permissions", async () => {
    const tokenDir = join(tempHome, ".config", "devin");
    mkdirSync(tokenDir, { recursive: true });
    const existingToken = randomUUID();
    const tokenPath = join(tokenDir, "bridge-token");
    writeFileSync(tokenPath, existingToken, { mode: 0o644 }); // wrong permissions

    mockHomedir.mockReturnValue(tempHome);
    vi.resetModules();
    const bridge = await import("./bridge.ts");

    try {
      const { token } = await bridge.startBridge(0);
      expect(token).toBe(existingToken);

      const st = statSync(tokenPath);
      expect(st.mode & 0o777).toBe(0o600);
    } finally {
      await bridge.stopBridge();
    }
  });
});

// ─── Auth: timingSafeEqual via real WebSocket ──────────────────────────────

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

  it("rejects connection with empty token string", async () => {
    const { port } = await startBridge(0);

    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=`);
    const closed = await new Promise<boolean>((resolve) => {
      ws.on("close", (code) => {
        resolve(code === 1008);
      });
      setTimeout(() => resolve(false), 3000);
    });

    expect(closed).toBe(true);
  });
});

// ─── Connection lifecycle: connect → message → response → disconnect ───────

describe("bridge connection lifecycle", () => {
  afterEach(async () => {
    await stopBridge();
  });

  /**
   * Connect a WebSocket client and capture the first "connected" message.
   * The listener is attached immediately to avoid race conditions.
   */
  async function connectClient(port: number, token: string): Promise<{ ws: WebSocket; connected: any }> {
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);
    const connected = await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 5000);
      ws.on("message", (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(data.toString()));
      });
      ws.on("error", (err) => { clearTimeout(timer); reject(err); });
    });
    return { ws, connected };
  }

  function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("message timeout")), timeoutMs);
      ws.on("message", (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(data.toString()));
      });
    });
  }

  it("connect → receive 'connected' → send ping → receive pong → disconnect", async () => {
    const { port, token } = await startBridge(0);
    const { ws, connected } = await connectClient(port, token);

    expect(connected.type).toBe("connected");
    expect(connected.payload?.clientId).toBeDefined();

    const pingId = randomUUID();
    ws.send(JSON.stringify({ id: pingId, type: "ping" }));

    const pong = await waitForMessage(ws);
    expect(pong.id).toBe(pingId);
    expect(pong.type).toBe("ping.response");
    expect(pong.payload?.ok).toBe(true);
    expect(pong.payload?.time).toBeDefined();

    ws.close();
    await new Promise<void>((resolve) => ws.on("close", () => resolve()));
  });

  it("skill.list returns empty array", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "skill.list" }));

    const resp = await waitForMessage(ws);
    expect(resp.id).toBe(id);
    expect(resp.type).toBe("skill.list.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.skills).toEqual([]);

    ws.close();
  });

  it("capture.start responds with status", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "capture.start", payload: { target: "screen", format: "mp4" } }));

    const resp = await waitForMessage(ws);
    expect(resp.id).toBe(id);
    expect(resp.type).toBe("capture.start.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.target).toBe("screen");
    expect(resp.payload?.format).toBe("mp4");
    expect(resp.payload?.status).toBe("started");

    ws.close();
  });

  it("render.start responds with status", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "render.start", payload: { recipe: "showcase-compose" } }));

    const resp = await waitForMessage(ws);
    expect(resp.id).toBe(id);
    expect(resp.type).toBe("render.start.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.recipe).toBe("showcase-compose");
    expect(resp.payload?.status).toBe("started");

    ws.close();
  });

  it("bridge.status returns running state", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "bridge.status" }));

    const resp = await waitForMessage(ws);
    expect(resp.id).toBe(id);
    expect(resp.type).toBe("bridge.status.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.running).toBe(true);
    expect(resp.payload?.port).toBe(port);
    expect(resp.payload?.clients).toBeGreaterThanOrEqual(1);
    expect(resp.payload?.uptime).toBeGreaterThanOrEqual(0);

    ws.close();
  });

  it("unknown message type returns error", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "nonexistent.action" }));

    const resp = await waitForMessage(ws);
    expect(resp.id).toBe(id);
    expect(resp.type).toBe("nonexistent.action.response");
    expect(resp.payload?.ok).toBe(false);
    expect(resp.payload?.error).toContain("Unknown message type");

    ws.close();
  });

  it("invalid JSON is handled gracefully", async () => {
    const { port, token } = await startBridge(0);
    const { ws } = await connectClient(port, token);

    ws.send("NOT VALID JSON {{{");

    const resp = await waitForMessage(ws);
    expect(resp.type).toBe("error");
    expect(resp.payload?.message).toBe("Invalid JSON");

    ws.close();
  });

  it("client count decrements on disconnect", async () => {
    const { port, token } = await startBridge(0);

    const { ws: ws1 } = await connectClient(port, token);
    expect(getBridgeState().clientCount).toBe(1);

    const { ws: ws2 } = await connectClient(port, token);
    expect(getBridgeState().clientCount).toBe(2);

    ws1.close();
    await new Promise<void>((resolve) => ws1.on("close", () => resolve()));
    await new Promise((r) => setTimeout(r, 100));
    expect(getBridgeState().clientCount).toBe(1);

    ws2.close();
    await new Promise<void>((resolve) => ws2.on("close", () => resolve()));
    await new Promise((r) => setTimeout(r, 100));
    expect(getBridgeState().clientCount).toBe(0);
  });

  it("connection drop cleans up client entry", async () => {
    const { port, token } = await startBridge(0);

    const { ws } = await connectClient(port, token);
    expect(getBridgeState().clientCount).toBe(1);

    ws.terminate();

    await new Promise((r) => setTimeout(r, 200));
    expect(getBridgeState().clientCount).toBe(0);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────

describe("bridge edge cases", () => {
  afterEach(async () => {
    await stopBridge();
  });

  it("multiple clients receive broadcast messages", async () => {
    const { port, token } = await startBridge(0);

    const ws1 = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);
    const ws2 = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);

    const messages1: any[] = [];
    const messages2: any[] = [];

    ws1.on("message", (data) => messages1.push(JSON.parse(data.toString())));
    ws2.on("message", (data) => messages2.push(JSON.parse(data.toString())));

    await Promise.all([
      new Promise<void>((r) => ws1.on("open", r)),
      new Promise<void>((r) => ws2.on("open", r)),
    ]);

    await new Promise((r) => setTimeout(r, 200));

    const broadcastId = randomUUID();
    ws1.send(JSON.stringify({ id: broadcastId, type: "bridge.broadcast", payload: { text: "hello" } }));

    await new Promise((r) => setTimeout(r, 200));

    const ws2Broadcast = messages2.find((m) => m.type === "broadcast");
    expect(ws2Broadcast).toBeDefined();
    expect(ws2Broadcast.payload?.text).toBe("hello");

    const ws1Response = messages1.find((m) => m.type === "bridge.broadcast.response");
    expect(ws1Response).toBeDefined();
    expect(ws1Response.payload?.ok).toBe(true);

    ws1.close();
    ws2.close();
  });

  it("capture.status returns unknown when not capturing", async () => {
    const { port, token } = await startBridge(0);
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);

    const messages: any[] = [];
    ws.on("message", (data) => messages.push(JSON.parse(data.toString())));

    await new Promise<void>((r) => ws.on("open", r));
    await new Promise((r) => setTimeout(r, 100));

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "capture.status" }));

    await new Promise((r) => setTimeout(r, 200));

    const resp = messages.find((m) => m.id === id);
    expect(resp).toBeDefined();
    expect(resp.type).toBe("capture.status.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.status).toBe("unknown");

    ws.close();
  });

  it("render.status returns unknown when not rendering", async () => {
    const { port, token } = await startBridge(0);
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);

    const messages: any[] = [];
    ws.on("message", (data) => messages.push(JSON.parse(data.toString())));

    await new Promise<void>((r) => ws.on("open", r));
    await new Promise((r) => setTimeout(r, 100));

    const id = randomUUID();
    ws.send(JSON.stringify({ id, type: "render.status" }));

    await new Promise((r) => setTimeout(r, 200));

    const resp = messages.find((m) => m.id === id);
    expect(resp).toBeDefined();
    expect(resp.type).toBe("render.status.response");
    expect(resp.payload?.ok).toBe(true);
    expect(resp.payload?.status).toBe("unknown");

    ws.close();
  });
});
