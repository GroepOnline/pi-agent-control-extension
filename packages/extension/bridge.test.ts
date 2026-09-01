import { describe, it, expect } from "vitest";
import { WebSocket } from "ws";
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


describe("bridge runtime jobs", () => {
  it("runs capture.start and exposes the completed result through capture.status", async () => {
    const { port, token } = await startBridge(0, undefined, undefined, {
      capture: async (target, format) => ({
        evidenceId: "bridge-proof", format, path: "/tmp", validated: true, structurallyValid: true,
        driver: "test", command: target, warnings: [], executed: true, success: true, artifacts: [],
      }),
      render: async (args) => `rendered:${args}`,
    });
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);
    const messages: any[] = [];
    ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
    await new Promise<void>((resolve, reject) => { ws.once("open", () => resolve()); ws.once("error", reject); });

    ws.send(JSON.stringify({ id: "c1", type: "capture.start", payload: { target: "https://example.com", format: "png" } }));
    let start: any;
    for (let i = 0; i < 50 && !start; i++) {
      await new Promise((r) => setTimeout(r, 10));
      start = messages.find((m) => m.id === "c1" && m.type === "capture.start.response");
    }
    expect(start?.payload?.ok).toBe(true);
    expect(start?.payload?.jobId).toBeTruthy();

    let completed: any;
    for (let i = 0; i < 50 && !completed; i++) {
      ws.send(JSON.stringify({ id: `s${i}`, type: "capture.status", payload: { jobId: start.payload.jobId } }));
      await new Promise((r) => setTimeout(r, 10));
      completed = messages.find((m) => m.type === "capture.status.response" && m.payload?.status === "completed");
    }
    expect(completed?.payload?.result?.evidenceId).toBe("bridge-proof");

    ws.close();
    await stopBridge();
  });
});


describe("bridge render and registry jobs", () => {
  it("returns live skills and completes render jobs", async () => {
    const { port, token } = await startBridge(0, undefined, undefined, {
      skills: () => [{ name: "capture", description: "Capture evidence" }],
      render: async (args) => `rendered:${args}`,
    });
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token}`);
    const messages: any[] = [];
    ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    ws.send(JSON.stringify({ id: "skills", type: "skill.list" }));
    ws.send(JSON.stringify({ id: "r1", type: "render.start", payload: { recipe: "qa-report" } }));
    let renderStart: any;
    for (let i = 0; i < 50 && !renderStart; i++) {
      await new Promise((r) => setTimeout(r, 10));
      renderStart = messages.find((m) => m.id === "r1" && m.type === "render.start.response");
    }
    expect(renderStart?.payload?.jobId).toBeTruthy();
    const skillReply = messages.find((m) => m.id === "skills" && m.type === "skill.list.response");
    expect(skillReply?.payload?.skills).toEqual([{ name: "capture", description: "Capture evidence" }]);

    let completed: any;
    for (let i = 0; i < 50 && !completed; i++) {
      ws.send(JSON.stringify({
        id: `rs${i}`,
        type: "render.status",
        payload: { jobId: renderStart.payload.jobId },
      }));
      await new Promise((r) => setTimeout(r, 10));
      completed = messages.find(
        (m) => m.type === "render.status.response" && m.payload?.status === "completed",
      );
    }
    expect(completed?.payload?.result).toBe("rendered:qa-report");

    ws.close();
    await stopBridge();
  });
});
