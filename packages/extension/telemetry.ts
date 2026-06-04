import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { rootDir } from "./utils.ts";

export interface TelemetryEvent {
  ts: string;
  type: string;
  name?: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySnapshot {
  sessionCount: number;
  toolCallCount: number;
  commandCount: number;
  errorCount: number;
  eventsLogged: number;
  startTime: string;
}

class MetricsRegistry {
  private counters: Map<string, number> = new Map();
  private events: TelemetryEvent[] = [];
  private readonly maxBuffer = 500;
  private startTime = new Date().toISOString();
  private logPath: string;
  private initialized = false;

  constructor() {
    const dir = join(rootDir(), "artifacts", "telemetry");
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    } catch { /* ignore */ }
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    this.logPath = join(dir, `telemetry-${ts}.jsonl`);
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.record("telemetry.init", { logPath: this.logPath });
  }

  increment(name: string, labels?: Record<string, string>) {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  record(type: string, metadata?: Record<string, unknown>, durationMs?: number, error?: string) {
    const event: TelemetryEvent = {
      ts: new Date().toISOString(),
      type,
      metadata,
      durationMs,
      error,
    };
    this.flush(event);
    this.events.push(event);
    if (this.events.length > this.maxBuffer) {
      this.events.shift();
    }
  }

  private flush(event: TelemetryEvent) {
    try {
      appendFileSync(this.logPath, JSON.stringify(event) + "\n");
    } catch { /* silent fail — don't block on telemetry */ }
  }

  snapshot(): TelemetrySnapshot {
    return {
      sessionCount: this.counters.get("session_start") ?? 0,
      toolCallCount: this.counters.get("tool_call") ?? 0,
      commandCount: this.counters.get("command_invoked") ?? 0,
      errorCount: this.counters.get("error") ?? 0,
      eventsLogged: this.events.length,
      startTime: this.startTime,
    };
  }

  formatReport(): string {
    const s = this.snapshot();
    const lines = [
      "## Telemetry Report",
      "",
      `| Metric | Value |`,
      `|---|---|`,
      `| **Sessions** | ${s.sessionCount} |`,
      `| **Tool calls** | ${s.toolCallCount} |`,
      `| **Commands** | ${s.commandCount} |`,
      `| **Errors** | ${s.errorCount} |`,
      `| **Buffered events** | ${s.eventsLogged} |`,
      `| **Log file** | \`${this.logPath}\` |`,
      `| **Started** | ${s.startTime} |`,
      "",
      `Counters:`,
      ...Array.from(this.counters.entries()).map(([k, v]) => `- \`${k}\`: ${v}`),
    ];
    return lines.join("\n");
  }
}

export const telemetry = new MetricsRegistry();
