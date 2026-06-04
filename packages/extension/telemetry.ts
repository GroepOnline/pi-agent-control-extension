import { existsSync, mkdirSync, appendFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
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

// ─── PII / Secret Exclusion ─────────────────────────────────────────────
// Keys whose values are always redacted (matched case-insensitively).
const SENSITIVE_KEYS = new Set([
  "token", "secret", "password", "api_key", "apikey", "authorization",
  "auth", "credential", "private_key", "privatekey", "access_token",
]);

// Keys whose values are truncated (not fully removed) to prevent large-data leaks.
const TRUNCATED_KEYS = new Set(["stdout", "stderr", "args", "command", "output"]);

const MAX_TRUNCATED_LENGTH = 120;

/**
 * Sanitize a metadata object before it is flushed to disk.  Redacts
 * known-sensitive keys and truncates large string values so that
 * tokens, paths, and raw command output never leak into JSONL files.
 */
export function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const sanitized: Record<string, unknown> = {};
  const home = homedir();

  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase();

    // 1. Redact sensitive keys entirely.
    if (SENSITIVE_KEYS.has(lower)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // 2. Truncate large string values.
    if (TRUNCATED_KEYS.has(lower) && typeof value === "string" && value.length > MAX_TRUNCATED_LENGTH) {
      sanitized[key] = value.slice(0, MAX_TRUNCATED_LENGTH) + "…[truncated]";
      continue;
    }

    // 3. Strip home directory from path-like strings.
    if (typeof value === "string" && home && value.startsWith(home)) {
      sanitized[key] = "~" + value.slice(home.length);
      continue;
    }

    sanitized[key] = value;
  }
  return sanitized;
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
    // Ensure the log file exists with restrictive permissions (0o600) so
    // that only the owning user can read secrets-free telemetry data.
    try {
      if (!existsSync(this.logPath)) {
        appendFileSync(this.logPath, "");
      }
      chmodSync(this.logPath, 0o600);
    } catch { /* ignore — not all filesystems support chmod */ }
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
      metadata: sanitizeMetadata(metadata),
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
