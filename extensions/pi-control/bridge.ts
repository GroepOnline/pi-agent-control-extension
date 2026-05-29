import { WebSocketServer, WebSocket } from "ws";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const BRIDGE_TOKEN_PATH = join(homedir(), ".config", "devin", "bridge-token");

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function maskToken(token: string): string {
  if (token.length <= 8) return "***";
  return token.slice(0, 4) + "..." + token.slice(-4);
}

export interface BridgeMessage {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
}

export interface BridgeClient {
  id: string;
  socket: WebSocket;
  connectedAt: Date;
  lastPing: Date;
}

export interface BridgeState {
  running: boolean;
  port: number;
  clientCount: number;
  events: BridgeMessage[];
  startTime: Date | null;
}

interface InternalBridgeState {
  running: boolean;
  port: number;
  clients: BridgeClient[];
  events: BridgeMessage[];
  startTime: Date | null;
}

function ensureToken(): string {
  try {
    if (existsSync(BRIDGE_TOKEN_PATH)) {
      try { chmodSync(BRIDGE_TOKEN_PATH, 0o600); } catch { /* ignore on filesystems without POSIX modes */ }
      return readFileSync(BRIDGE_TOKEN_PATH, "utf8").trim();
    }
  } catch { /* ignore */ }
  const token = randomUUID();
  mkdirSync(dirname(BRIDGE_TOKEN_PATH), { recursive: true });
  writeFileSync(BRIDGE_TOKEN_PATH, token, { mode: 0o600 });
  return token;
}

function loadToken(): string | null {
  try {
    if (existsSync(BRIDGE_TOKEN_PATH)) return readFileSync(BRIDGE_TOKEN_PATH, "utf8").trim();
  } catch { /* ignore */ }
  return null;
}

const bridgeState: InternalBridgeState = {
  running: false,
  port: 0,
  clients: [],
  events: [],
  startTime: null,
};

let pingInterval: ReturnType<typeof setInterval> | null = null;
let httpServer: ReturnType<typeof createServer> | null = null;
let wss: WebSocketServer | null = null;
let starting: Promise<{ port: number; token: string }> | null = null;

function broadcast(msg: BridgeMessage, exclude?: string) {
  const payload = JSON.stringify(msg);
  for (const client of bridgeState.clients) {
    if (client.socket.readyState === WebSocket.OPEN && client.id !== exclude) {
      client.socket.send(payload);
    }
  }
}

function addEvent(msg: BridgeMessage) {
  bridgeState.events.push(msg);
  if (bridgeState.events.length > 100) bridgeState.events.shift();
}

export async function stopBridge(): Promise<void> {
  if (pingInterval !== null) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  for (const client of bridgeState.clients) {
    try { client.socket.close(1001, "Bridge shutting down"); } catch { /* ignore */ }
  }

  if (wss !== null) {
    await new Promise<void>((resolve) => {
      wss!.close((err) => {
        if (err) console.warn("[bridge] Error closing WebSocket server:", err.message);
        resolve();
      });
    });
    wss = null;
  }

  if (httpServer !== null) {
    await new Promise<void>((resolve) => {
      httpServer!.close((err) => {
        if (err) console.warn("[bridge] Error closing HTTP server:", err.message);
        resolve();
      });
    });
    httpServer = null;
  }

  bridgeState.running = false;
  bridgeState.port = 0;
  bridgeState.clients = [];
  bridgeState.events.length = 0;
  bridgeState.startTime = null;
}

export function getBridgeState(): BridgeState {
  return {
    running: bridgeState.running,
    port: bridgeState.port,
    clientCount: bridgeState.clients.length,
    events: bridgeState.events,
    startTime: bridgeState.startTime,
  };
}

export function startBridge(port = 8765, pi?: ExtensionAPI, ctx?: ExtensionContext): Promise<{ port: number; token: string }> {
  if (starting) {
    return starting;
  }

  starting = (async () => {
    try {
      await stopBridge();

      const token = ensureToken();
      httpServer = createServer();
      wss = new WebSocketServer({ server: httpServer, maxPayload: 64 * 1024 });

      wss.on("connection", (socket, req) => {
        const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
        const providedToken = url.searchParams.get("token");
        if (!providedToken || !safeEqual(providedToken, token)) {
          socket.close(1008, "Invalid token");
          return;
        }

        const clientId = randomUUID();
        const client: BridgeClient = {
          id: clientId,
          socket,
          connectedAt: new Date(),
          lastPing: new Date(),
        };
        bridgeState.clients.push(client);

        socket.on("message", (data) => {
          try {
            const msg: BridgeMessage = JSON.parse(data.toString());
            handleMessage(msg, client, pi, ctx);
          } catch {
            socket.send(JSON.stringify({ id: "", type: "error", payload: { message: "Invalid JSON" } }));
          }
        });

        socket.on("close", () => {
          bridgeState.clients = bridgeState.clients.filter((c) => c.id !== clientId);
        });

        socket.on("error", () => {
          bridgeState.clients = bridgeState.clients.filter((c) => c.id !== clientId);
        });

        socket.on("pong", () => {
          client.lastPing = new Date();
        });

        socket.send(JSON.stringify({ id: "", type: "connected", payload: { clientId } }));
        addEvent({ id: randomUUID(), type: "client.connected", payload: { clientId } });
      });

      // Ping clients every 30s
      pingInterval = setInterval(() => {
        for (const client of bridgeState.clients) {
          if (client.socket.readyState === WebSocket.OPEN) {
            client.socket.ping();
          }
        }
      }, 30000);

      return new Promise<{ port: number; token: string }>((resolve, reject) => {
        httpServer!.listen(port, "127.0.0.1", () => {
          bridgeState.running = true;
          bridgeState.port = port;
          bridgeState.startTime = new Date();
          resolve({ port, token });
        });

        httpServer!.on("error", (err) => {
          stopBridge();
          reject(err);
        });
      });
    } finally {
      starting = null;
    }
  })();

  return starting;
}

async function handleMessage(msg: BridgeMessage, client: BridgeClient, _pi?: ExtensionAPI, _ctx?: ExtensionContext) {
  const reply = (payload: Record<string, unknown>) => {
    client.socket.send(JSON.stringify({ id: msg.id, type: `${msg.type}.response`, payload }));
  };

  switch (msg.type) {
    case "ping":
      reply({ ok: true, time: new Date().toISOString() });
      break;

    case "skill.list": {
      reply({ ok: true, skills: [] }); // Would be populated from registry
      break;
    }

    case "capture.start": {
      const target = String(msg.payload?.target ?? "");
      const format = String(msg.payload?.format ?? "mp4");
      addEvent({ id: msg.id, type: "capture.started", payload: { target, format } });
      reply({ ok: true, target, format, status: "started" });
      break;
    }

    case "capture.status": {
      reply({ ok: true, status: "unknown" });
      break;
    }

    case "render.start": {
      const recipe = String(msg.payload?.recipe ?? "showcase-compose");
      addEvent({ id: msg.id, type: "render.started", payload: { recipe } });
      reply({ ok: true, recipe, status: "started" });
      break;
    }

    case "render.status": {
      reply({ ok: true, status: "unknown" });
      break;
    }

    case "bridge.status": {
      reply({
        ok: true,
        running: bridgeState.running,
        port: bridgeState.port,
        clients: bridgeState.clients.length,
        uptime: bridgeState.startTime ? Date.now() - bridgeState.startTime.getTime() : 0,
      });
      break;
    }

    case "bridge.broadcast": {
      broadcast({ id: msg.id, type: "broadcast", payload: msg.payload ?? {} }, client.id);
      reply({ ok: true, recipients: bridgeState.clients.length - 1 });
      break;
    }

    default:
      reply({ ok: false, error: `Unknown message type: ${msg.type}` });
  }
}

export function formatBridgeStatusMarkdown(): string {
  const s = getBridgeState();
  return [
    `## Bridge Status`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| **Running** | ${s.running ? "✅" : "❌"} |`,
    `| **Port** | ${s.port || "N/A"} |`,
    `| **Clients** | ${s.clientCount} |`,
    `| **Uptime** | ${s.startTime ? `${Math.round((Date.now() - s.startTime.getTime()) / 1000)}s` : "N/A"} |`,
    `| **Events** | ${s.events.length} |`,
    ``,
    s.running
      ? `Token: \`${maskToken(loadToken() || "")}\``
      : "Bridge not running. Start with `/bridge-start`.",
  ].join("\n");
}

export function registerBridge(pi: ExtensionAPI) {
  pi.registerCommand("bridge-start", {
    description: "Start the remote agent WebSocket bridge",
    handler: async (args: string, ctx: ExtensionContext) => {
      const port = parseInt(args.trim()) || 8765;
      try {
        const { port: actualPort, token } = await startBridge(port, pi, ctx);
        const masked = token.slice(0, 4) + "..." + token.slice(-4);
        ctx.ui?.notify?.(
          `## Bridge Started\n\n- Port: ${actualPort}\n- Token: \`${masked}\` (full token in ~/.config/devin/bridge-token)\n- URL: ws://127.0.0.1:${actualPort}?token=<see token file>`,
          "info",
        );
      } catch (e: unknown) {
        ctx.ui?.notify?.(`Failed to start bridge: ${String(e)}`, "error");
      }
    },
  });

  pi.registerCommand("bridge-status", {
    description: "Show remote agent bridge status",
    handler: async (_args: string, ctx: ExtensionContext) => {
      ctx.ui?.notify?.(formatBridgeStatusMarkdown(), "info");
    },
  });
}
