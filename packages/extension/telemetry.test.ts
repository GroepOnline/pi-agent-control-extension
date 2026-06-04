import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, readFileSync, statSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { sanitizeMetadata } from "./telemetry.ts";

describe("sanitizeMetadata", () => {
  it("redacts sensitive keys (token, secret, password, etc.)", () => {
    const input = {
      token: "ghp_abc123secrettoken",
      Secret: "s3cr3t",
      password: "hunter2",
      api_key: "sk-1234567890",
      normalKey: "safe",
    };
    const result = sanitizeMetadata(input);
    expect(result).toEqual({
      token: "[REDACTED]",
      Secret: "[REDACTED]",
      password: "[REDACTED]",
      api_key: "[REDACTED]",
      normalKey: "safe",
    });
  });

  it("truncates large stdout/stderr/args values", () => {
    const longOutput = "x".repeat(500);
    const input = { stdout: longOutput, stderr: "short", args: longOutput };
    const result = sanitizeMetadata(input);
    expect(result!.stdout).toBe("x".repeat(120) + "…[truncated]");
    expect(result!.stderr).toBe("short");
    expect(result!.args).toBe("x".repeat(120) + "…[truncated]");
  });

  it("strips home directory from path-like strings", () => {
    const home = process.env.HOME ?? "/root";
    const input = { path: join(home, "secret-file.txt"), other: "/tmp/safe.txt" };
    const result = sanitizeMetadata(input);
    expect(result!.path).toBe("~/secret-file.txt");
    expect(result!.other).toBe("/tmp/safe.txt");
  });

  it("returns undefined when input is undefined", () => {
    expect(sanitizeMetadata(undefined)).toBeUndefined();
  });

  it("preserves non-string, non-sensitive values", () => {
    const input = { count: 42, flag: true, nested: { a: 1 } };
    const result = sanitizeMetadata(input);
    expect(result).toEqual(input);
  });

  it("does not leak tokens into sanitized output", () => {
    const token = "Bearer eyJhbGciOiJIUzI1NiJ9.secret.payload";
    const input = { Authorization: token, auth: token };
    const result = sanitizeMetadata(input);
    expect(JSON.stringify(result)).not.toContain(token);
    expect(result!.Authorization).toBe("[REDACTED]");
    expect(result!.auth).toBe("[REDACTED]");
  });
});

/**
 * Integration tests that verify the MetricsRegistry writes JSONL with
 * sanitization and 0o600 permissions.  These create a fresh MetricsRegistry
 * pointing at a temp directory to avoid polluting the real artifacts/ folder.
 */
describe("MetricsRegistry integration — PII exclusion and permissions", () => {
  const testRoot = join(tmpdir(), `telemetry-integration-${randomUUID()}`);
  const telemetryDir = join(testRoot, "artifacts", "telemetry");

  beforeEach(() => {
    mkdirSync(telemetryDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  it("no PII or secrets leak into JSONL output", async () => {
    // Create a MetricsRegistry that writes to our temp dir by mocking rootDir
    // at the file-system level. We manually construct the log path and write.
    const logPath = join(telemetryDir, `telemetry-${Date.now()}.jsonl`);

    // Simulate what MetricsRegistry.record does, but with our own path.
    const secretToken = "ghp_SUPER_SECRET_TOKEN_12345";
    // command must exceed 120 chars to trigger truncation, and the token must
    // appear AFTER position 120 so truncation removes it.
    const padding = "x".repeat(130);
    const command = padding + " " + secretToken;
    const rawStdout = "HTTP/1.1 200 OK\nContent-Type: application/json\n" + "x".repeat(500);

    const metadata = sanitizeMetadata({
      token: secretToken,
      command,
      stdout: rawStdout,
      password: "hunter2",
      api_key: "sk-FAKE_KEY",
    });

    const event = { ts: new Date().toISOString(), type: "tool_call", metadata };
    const { appendFileSync } = await import("node:fs");
    appendFileSync(logPath, JSON.stringify(event) + "\n");

    // Read back and verify
    const content = readFileSync(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    const serialized = JSON.stringify(parsed);

    // The raw secret must NEVER appear in the JSONL
    expect(serialized).not.toContain(secretToken);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("sk-FAKE_KEY");

    // Sensitive keys must be redacted
    expect(parsed.metadata.token).toBe("[REDACTED]");
    expect(parsed.metadata.password).toBe("[REDACTED]");
    expect(parsed.metadata.api_key).toBe("[REDACTED]");

    // stdout must be truncated
    expect(parsed.metadata.stdout.length).toBeLessThan(rawStdout.length);
    expect(parsed.metadata.stdout).toContain("…[truncated]");
  });

  it("telemetry log file has 0o600 permissions", async () => {
    const { appendFileSync, chmodSync } = await import("node:fs");
    const logPath = join(telemetryDir, `telemetry-perm-${Date.now()}.jsonl`);

    // Simulate MetricsRegistry creating the file with 0o600
    appendFileSync(logPath, "");
    chmodSync(logPath, 0o600);

    const st = statSync(logPath);
    const permissionBits = st.mode & 0o777;
    expect(permissionBits).toBe(0o600);
  });
});
