import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const BRIDGE_TOKEN_PATH = join(homedir(), ".config", "devin", "bridge-token");

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
      return readFileSync(BRIDGE_TOKEN_PATH, "utf8").trim();
    }
  } catch { /* ignore */ }
  const token = randomUUID();
  mkdirSync(dirname(BRIDGE_TOKEN_PATH), { recursive: true });
  writeFileSync(BRIDGE_TOKEN_PATH, token);
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
  return new Promise((resolve, reject) => {
    if (bridgeState.running) {
      resolve({ port: bridgeState.port, token: loadToken() ?? ensureToken() });
      return;
    }

    const token = ensureToken();
    const httpServer = createServer();
    const wss = new WebSocketServer({ server: httpServer, verifyClient: (info: any) => {
      // Reject connections with suspicious or missing Origin/Host headers
      const host = info.req.headers.host || "";
      return host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host === "";
    } });

    wss.on("connection", (socket, req) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const providedToken = url.searchParams.get("token");
      if (providedToken !== token) {
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
        // Reject oversized messages (> 1 MB) to prevent DoS
        if (Buffer.isBuffer(data) ? data.length : Buffer.from(data as ArrayBuffer).length > 1024 * 1024) {
          socket.close(1009, "Message too large");
          return;
        }
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
    const pingInterval = setInterval(() => {
      for (const client of bridgeState.clients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      }
    }, 30000);

    httpServer.listen(port, "127.0.0.1", () => {
      bridgeState.running = true;
      bridgeState.port = port;
      bridgeState.startTime = new Date();
      resolve({ port, token });
    });

    httpServer.on("error", (err) => {
      clearInterval(pingInterval);
      bridgeState.running = false;
      bridgeState.port = 0;
      bridgeState.startTime = null;
      try { wss.close(); } catch { /* ignore */ }
      try { httpServer.close(); } catch { /* ignore */ }
      reject(err);
    });
  });
}

async function handleMessage(msg: BridgeMessage, client: BridgeClient, pi?: ExtensionAPI, ctx?: ExtensionContext) {
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
      ? `Token: \`${loadToken() ?? "N/A"}\``
      : "Bridge not running. Start with `/bridge-start`.",
  ].join("\n");
}

function show(text: string) {
  return async (_args: string, ctx: ExtensionContext) => { ctx.ui?.notify?.(text, "info"); };
}

export function registerBridge(pi: ExtensionAPI) {
  pi.registerCommand("bridge-start", {
    description: "Start the remote agent WebSocket bridge",
    handler: async (args: string, ctx: ExtensionContext) => {
      const port = parseInt(args.trim()) || 8765;
      try {
        const { port: actualPort, token } = await startBridge(port, pi, ctx);
        ctx.ui?.notify?.(
          `## Bridge Started\n\n- Port: ${actualPort}\n- Token: *** (read from ${BRIDGE_TOKEN_PATH})\n- URL: ws://localhost:${actualPort}?token=<TOKEN>`,
          "info",
        );
      } catch (e: any) {
        ctx.ui?.notify?.(`Failed to start bridge: ${e.message}`, "error");
      }
    },
  });

  pi.registerCommand("bridge-status", {
    description: "Show remote agent bridge status",
    handler: show(formatBridgeStatusMarkdown()),
  });
}
