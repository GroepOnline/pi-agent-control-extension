import { Type } from "typebox";
import type { ExecFileException } from "node:child_process";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { rootDir } from "../utils.ts";

const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 120_000;
const MAX_OUTPUT_BYTES = 102_400; // 100 KB

/** Base commands that are permitted to execute. */
export const ALLOWED_COMMANDS: ReadonlySet<string> = new Set([
  // filesystem inspection (read-only)
  "ls", "find", "stat", "file", "du", "df", "wc", "head", "tail",
  "cat", "less", "tree", "readlink", "realpath", "basename", "dirname",
  // text processing
  "grep", "rg", "sed", "awk", "sort", "uniq", "cut", "tr", "diff",
  "jq", "xargs", "tee", "column",
  // development
  "git", "npm", "npx", "node", "tsc", "vitest", "eslint", "prettier",
  "pnpm", "yarn", "bun", "deno",
  "python3", "python", "pip", "pip3", "uv",
  "cargo", "rustc", "make", "cmake",
  // system info
  "echo", "printf", "date", "whoami", "hostname", "uname", "env", "printenv",
  "which", "type", "id", "pwd", "true", "false", "test",
  // network (read-only)
  "ping", "dig", "nslookup", "host", "curl",
  // archive
  "tar", "zip", "unzip", "gzip", "gunzip",
  // process inspection
  "ps", "top", "htop", "lsof",
  // utilities
  "sleep", "base64", "mkdir",
  // pi-specific
  "tctl", "tuistory", "agent-browser", "doctor-control",
]);

/** Directories the tool is allowed to operate in. */
export const ALLOWED_CWD_PREFIXES: readonly string[] = [rootDir(), "/home", "/tmp", "/var/tmp"];

/**
 * Effective allowed cwd prefixes: the built-in list plus any extra entries
 * from SHELL_COMMAND_ALLOWED_CWD_PREFIXES (colon-separated on POSIX,
 * semicolon on Windows). Lets fleet/CI hosts (e.g. runners whose HOME or
 * workspace lives outside /home and /tmp) extend the allowlist via the
 * environment without code changes. Unset means defaults only.
 * Read at call time so tests can exercise it.
 */
export function allowedCwdPrefixes(): readonly string[] {
  const raw = process.env.SHELL_COMMAND_ALLOWED_CWD_PREFIXES;
  if (!raw) return ALLOWED_CWD_PREFIXES;
  const extra = raw
    .split(process.platform === "win32" ? ";" : ":")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...ALLOWED_CWD_PREFIXES, ...extra];
}

/**
 * Parse leading VAR=value pairs from a command string.
 * Returns the env map and the remaining command part.
 */
export function parseEnvPrefix(raw: string): { env: Record<string, string>; rest: string } {
  const env: Record<string, string> = {};
  let rest = raw.trimStart();
  const re = /^(\w+)=(\S+)\s+/;
  let m;
  while ((m = re.exec(rest))) {
    env[m[1]!] = m[2]!;
    rest = rest.slice(m[0].length);
  }
  return { env, rest };
}

/**
 * Parse a command string into tokens, respecting single and double quotes.
 * Quotes are stripped from the resulting tokens.
 */
export function parseCommandTokens(raw: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current) { tokens.push(current); current = ""; }
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

/** Extract the basename from a command string (handles paths and env prefixes). */
export function extractBaseCommand(command: string): string {
  const trimmed = command.trim();
  const withoutEnv = trimmed.replace(/^(\w+=\S+\s+)+/, "");
  const first = withoutEnv.split(/\s+/)[0] ?? "";
  const parts = first.split("/");
  return parts[parts.length - 1] ?? "";
}

/** Sensitive path patterns that should not appear in command arguments. */
const SENSITIVE_PATH_RE: readonly RegExp[] = [
  /\/etc\/(passwd|shadow|gshadow|sudoers|master\.passwd)/,
  /\/etc\/ssh\b/,
  /\/\.ssh\b/,
  /\/\.gnupg\b/,
  /\/\.aws\//,
  /\/\.env\b/,
];

/** Check if any argument references a sensitive path. Returns the offending arg or null. */
export function containsSensitivePath(args: readonly string[]): string | null {
  for (const arg of args) {
    for (const re of SENSITIVE_PATH_RE) {
      if (re.test(arg)) return arg;
    }
  }
  return null;
}

/** Validate that cwd is under an allowed prefix (symlink-safe via realpathSync). */
export function isAllowedCwd(cwd: string): boolean {
  let resolved: string;
  try {
    resolved = realpathSync(resolve(cwd));
  } catch {
    resolved = resolve(cwd);
  }
  return allowedCwdPrefixes().some((prefix) => {
    let allowed: string;
    try {
      allowed = realpathSync(prefix);
    } catch {
      allowed = resolve(prefix);
    }
    return resolved === allowed || resolved.startsWith(allowed + sep);
  });
}

/** Normalize timeout value (clamped to valid range). */
export function normalizeTimeout(timeout?: number): number {
  return Math.min(Math.max(timeout ?? DEFAULT_TIMEOUT, 1), MAX_TIMEOUT);
}

/** Truncate a string to maxBytes (UTF-8), appending a truncation notice. */
function truncateOutput(text: string, maxBytes: number): string {
  const buf = Buffer.from(text, "utf8");
  if (buf.length <= maxBytes) return text;
  const truncated = buf.subarray(0, maxBytes).toString("utf8");
  return truncated + `\n\n--- output truncated (${buf.length} bytes, limit ${maxBytes}) ---`;
}

// ── Audit log ──────────────────────────────────────────────────────

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

/** Redact sensitive patterns from command strings before logging. */
function redactCommand(cmd: string): string {
  let redacted = cmd;
  redacted = redacted.replace(/\b(\w*(?:token|key|secret|password|passwd|auth|credential)\w*)=(\S+)/gi, "$1=<REDACTED>");
  redacted = redacted.replace(/(Bearer\s+)\S+/gi, "$1<REDACTED>");
  redacted = redacted.replace(/(Authorization:\s*)\S+/gi, "$1<REDACTED>");
  redacted = redacted.replace(/\bAKIA[A-Z0-9]{16}\b/g, "<REDACTED>");
  redacted = redacted.replace(/\b[0-9a-f]{40,}\b/gi, "<REDACTED>");
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

// ── Tool definition ────────────────────────────────────────────────

export const shellCommandTool = {
  name: "control_shell_command",
  label: "Shell Command",
  description:
    "Execute an allowlisted command and return its stdout/stderr. " +
    "Commands are executed directly via execFile (no shell interpreter) — " +
    "shell metacharacters (;, |, &&, >, <, backticks) are NOT interpreted. " +
    "Arguments are validated against an allowlist and sensitive-path blocklist, " +
    "cwd is restricted, output is size-limited, and all invocations are audit-logged.",
  parameters: Type.Object({
    command: Type.String({ description: "The command to execute (must start with an allowed base command; no shell operators)" }),
    cwd: Type.Optional(
      Type.String({ description: "Working directory (must be under /home, /tmp, the project root, or a SHELL_COMMAND_ALLOWED_CWD_PREFIXES entry; defaults to $HOME)" }),
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
    const timeout = normalizeTimeout(p.timeout);

    // ── Parse env prefix and tokenize (no shell) ──
    const { env: cmdEnv, rest: cmdRest } = parseEnvPrefix(p.command);
    const tokens = parseCommandTokens(cmdRest);

    if (tokens.length === 0) {
      const reason = `Command "(empty)" is not in the allowlist.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: p.cwd ?? null, success: false, error: reason },
      };
    }

    const binary = tokens[0]!;
    const args = tokens.slice(1);

    // ── Allowlist check ──
    const binaryParts = binary.split("/");
    const baseCmd = binaryParts[binaryParts.length - 1] ?? "";
    if (!baseCmd || !ALLOWED_COMMANDS.has(baseCmd)) {
      const reason = `Command "${baseCmd || "(empty)"}" is not in the allowlist.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: p.cwd ?? null, success: false, error: reason },
      };
    }

    // ── Sensitive path check ──
    const sensitiveArg = containsSensitivePath(args);
    if (sensitiveArg) {
      const reason = `Argument "${sensitiveArg}" references a sensitive path. Access to credentials, SSH keys, and system auth files is blocked.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: p.cwd ?? null, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: p.cwd ?? null, success: false, error: reason },
      };
    }

    // ── cwd validation ──
    const effectiveCwd = p.cwd ?? process.env.HOME;
    if (effectiveCwd && !isAllowedCwd(effectiveCwd)) {
      const reason = `Working directory "${effectiveCwd}" is not under an allowed path.`;
      auditLog({ ts: new Date().toISOString(), command: p.command, cwd: effectiveCwd, timeout, success: false, blocked: true, blockReason: reason });
      return {
        content: [{ type: "text" as const, text: `Blocked: ${reason}` }],
        details: { command: p.command, cwd: effectiveCwd, success: false, error: reason },
      };
    }

    // ── Execute (no shell — binary + args passed directly) ──
    try {
      const execEnv = Object.keys(cmdEnv).length > 0
        ? { ...process.env, ...cmdEnv }
        : undefined;

      const { stdout, stderr } = await new Promise<{
        stdout: string;
        stderr: string;
      }>((resolve, reject) => {
        execFile(
          binary,
          args,
          { encoding: "utf8", timeout, cwd: effectiveCwd, env: execEnv },
          (err: ExecFileException | null, stdout: string, stderr: string) => {
            if (err) reject(Object.assign({ message: err.message, stdout, stderr }, err));
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
