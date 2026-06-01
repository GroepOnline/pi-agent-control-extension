import { Type } from "typebox";
import type { ExecFileException } from "node:child_process";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { rootDir } from "../utils.ts";

const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 120_000;
const MAX_OUTPUT_BYTES = 102_400;

const ALLOWED_COMMANDS: ReadonlySet<string> = new Set([
  "ls", "find", "stat", "file", "du", "df", "wc", "head", "tail",
  "cat", "less", "tree", "readlink", "realpath", "basename", "dirname",
  "grep", "rg", "sed", "awk", "sort", "uniq", "cut", "tr", "diff",
  "jq", "xargs", "tee", "column",
  "git", "npm", "npx", "node", "tsc", "vitest", "eslint", "prettier",
  "pnpm", "yarn", "bun", "deno",
  "python3", "python", "pip", "pip3", "uv",
  "cargo", "rustc", "make", "cmake",
  "echo", "printf", "date", "whoami", "hostname", "uname", "env", "printenv",
  "which", "type", "id", "pwd", "true", "false", "test",
  "ping", "dig", "nslookup", "host", "curl",
  "tar", "zip", "unzip", "gzip", "gunzip",
  "ps", "top", "htop", "lsof",
  "sleep", "base64",
  "tctl", "tuistory", "agent-browser", "doctor-control",
]);

function getAllowedPrefixes(): string[] {
  return [rootDir(), "/home", "/tmp", "/var/tmp"];
}

const ALLOWED_CWD_PREFIXES: readonly string[] = getAllowedPrefixes();

function extractBaseCommand(command: string): string {
  const trimmed = command.trim();
  const withoutEnv = trimmed.replace(/^(\w+=\S+\s+)+/, "");
  const first = withoutEnv.split(/\s+/)[0] ?? "";
  const parts = first.split("/");
  return parts[parts.length - 1] ?? "";
}

function isAllowedCwd(cwd: string): boolean {
  let resolved: string;
  try {
    resolved = realpathSync(resolve(cwd));
  } catch {
    resolved = resolve(cwd);
  }
  return ALLOWED_CWD_PREFIXES.some((prefix) => {
    let allowed: string;
    try {
      allowed = realpathSync(prefix);
    } catch {
      allowed = resolve(prefix);
    }
    return resolved === allowed || resolved.startsWith(allowed + sep);
  });
}

function truncateOutput(text: string, maxBytes: number): string {
  const buf = Buffer.from(text, "utf8");
  if (buf.length <= maxBytes) return text;
  const truncated = buf.subarray(0, maxBytes).toString("utf8");
  return truncated + `\n\n--- output truncated (${buf.length} bytes, limit ${maxBytes}) ---`;
}

interface AuditEntry {
  ts: string;
  command: string;
  cwd: string | null;
  timeout: number;
  success: boolean;
  blocked: boolean;
  blockReason?: string;
  durationMs?: number;
  error?: string;
}

function redactCommand(cmd: string): string {
  let redacted = cmd.replace(/^(\w+)=\S+/gm, "$1=<REDACTED>");
  redacted = redacted.replace(/(-[A-Za-z]*?(?:token|key|secret|password|auth|credential)\s+)\S+/gi, "$1<REDACTED>");
  redacted = redacted.replace(/(Bearer\s+)\S+/gi, "$1<REDACTED>");
  return redacted;
}

let auditLogPath: string | null = null;

function ensureAuditLog(): string {
  if (auditLogPath) return auditLogPath;
  const dir = join(rootDir(), "artifacts", "audit");
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch { /* ignore */ }
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  auditLogPath = join(dir, `shell-audit-${ts}.jsonl`);
  return auditLogPath;
}

function auditLog(entry: AuditEntry): void {
  try {
    const safeEntry = { ...entry, command: redactCommand(entry.command) };
    appendFileSync(ensureAuditLog(), JSON.stringify(safeEntry) + "\n");
  } catch { /* silent */ }
}

export const shellCommandTool = {
  name: "control_shell_command",
  label: "Shell Command",
  description:
    "Execute an allowlisted shell command and return its stdout/stderr. " +
    "Commands are validated against an allowlist, cwd is restricted, " +
    "output is size-limited, and all invocations are audit-logged.",
  parameters: Type.Object({
    command: Type.String({ description: "The command to execute (must start with an allowed base command)" }),
    cwd: Type.Optional(
      Type.String({ description: "Working directory (must be under /home, /tmp, or project root; defaults to $HOME)" }),
    ),
    timeout: Type.Optional(
      Type.Number({
        description: `Timeout in milliseconds (default ${DEFAULT_TIMEOUT}, max ${MAX_TIMEOUT})`,
      }),
    ),
  }),
  async execute(
    _id: string,
    p: { command: string; cwd?: string; timeout?: number },
  ) {
    const startTime = Date.now();
    const timeout = Math.min(Math.max(p.timeout ?? DEFAULT_TIMEOUT, 1), MAX_TIMEOUT);

    const baseCmd = extractBaseCommand(p.command);
    if (!baseCmd || !ALLOWED_COMMANDS.has(baseCmd)) {
      const reason = `Command "${baseCmd || "(empty)"}" is not in the allowlist.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: p.cwd ?? null, success: false, error: reason },
      };
    }

    const effectiveCwd = p.cwd ?? process.env.HOME;
    if (effectiveCwd && !isAllowedCwd(effectiveCwd)) {
      const reason = `Working directory "${effectiveCwd}" is not under an allowed path.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: effectiveCwd, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: effectiveCwd, success: false, error: reason },
      };
    }

    try {
      const { stdout, stderr } = await new Promise<{
        stdout: string;
        stderr: string;
      }>((resolve, reject) => {
        execFile(
          "/bin/sh",
          ["-c", p.command],
          { encoding: "utf8", timeout, cwd: effectiveCwd },
          (err: ExecFileException | null, stdout: string, stderr: string) => {
            if (err) reject(Object.assign({}, err, { message: err.message, stdout, stderr }));
            else resolve({ stdout, stderr });
          },
        );
      });

      const raw = [stdout.trim(), stderr.trim()]
        .filter(Boolean)
        .join("\n---stderr---\n");
      const output = truncateOutput(raw || "(no output)", MAX_OUTPUT_BYTES);

      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: true, blocked: false, durationMs: Date.now() - startTime });

      return {
        content: [{ type: "text" as const, text: output }],
        details: { command: p.command, cwd: p.cwd ?? null, success: true, error: "" },
      };
    } catch (e: any) {
      const stderr = (e.stderr as string) ?? "";
      const stdout = (e.stdout as string) ?? "";
      const raw = [stderr.trim(), stdout.trim(), e.message]
        .filter(Boolean)
        .join("\n");
      const msg = truncateOutput(raw, MAX_OUTPUT_BYTES);

      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: false, blocked: false, durationMs: Date.now() - startTime, error: e.message });

      return {
        content: [{ type: "text" as const, text: `Error: ${msg}` }],
        details: {
          command: p.command,
          cwd: p.cwd ?? null,
          success: false,
          error: e.message as string,
        },
      };
    }
  },
};
