import { execFileSync } from "node:child_process";
import { checkShellCommand } from "../guards.ts";

export const OS_CONTROL_STATUS = {
  implemented: true,
  driver: "os-control",
  target: "tty + tmux session management",
  capabilities: ["tmux", "tty", "window-management", "display-capture"],
} as const;

export function osControlGuidance() {
  return [
    "# OS Control (Computer Use)",
    "",
    "Status: **implemented** — uses tmux for session management (tty mode).",
    "",
    "### Available Actions",
    "- `launch <name> <cmd>` — create a new tmux session and run a command",
    "- `send <name> <text>` — send text + Enter to a session",
    "- `type <name> <text>` — type text without Enter into a session",
    "- `capture <name>` — read visible output from a session pane",
    "- `snapshot <name>` — alias for capture with full history",
    "- `list` — list all tmux sessions",
    "- `kill <name>` — terminate a session",
    "",
    "### When GUI is available (Wayland)",
    "- Use `cage` for sandboxed compositor",
    "- Use `wtype` for keyboard/mouse injection",
    "- Use `grim`/`slurp` for screenshots",
    "",
    "Route with: `control_route` using 'computer use' or 'os control' keywords.",
  ].join("\n");
}

export interface OsControlResult {
  output: string;
  success: boolean;
  sessionName?: string;
}

const TMUX_BIN = "tmux";

function validSessionName(name: string): string | null {
  if (!name || name.length > 64) return null;
  if (/[^a-zA-Z0-9._-]/.test(name)) return null;
  return name;
}

export function osControlCommand(
  action: string,
  target?: string,
  args?: string[]
): OsControlResult {
  switch (action) {
    case "launch": {
      const rawName = target || `os-${Date.now()}`;
      const sessionName = validSessionName(rawName);
      if (!sessionName) {
        return { output: `Error: invalid session name '${rawName}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      // Preserve the full multi-token command (e.g. "npm run dev"), not just args[0].
      const cmd = args && args.length > 0 ? args.join(" ") : "bash";
      const blocked = checkShellCommand(cmd);
      if (blocked) {
        return { output: `Blocked: ${blocked.reason}`, success: false };
      }
      try {
        execFileSync(TMUX_BIN, [
          "new-session",
          "-d",
          "-s",
          sessionName,
          cmd,
        ], { encoding: "utf8", timeout: 10000 });
        return {
          output: `Session '${sessionName}' launched with command: ${cmd}`,
          success: true,
          sessionName,
        };
      } catch (e: any) {
        return {
          output: `Error launching session: ${e.stderr || e.message}`,
          success: false,
        };
      }
    }

    case "send": {
      if (!target) {
        return { output: "Error: session name required for 'send'", success: false };
      }
      const sessionName = validSessionName(target);
      if (!sessionName) {
        return { output: `Error: invalid session name '${target}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      const command = args?.join(" ") || "";
      // send submits the text with Enter, so it executes as a shell command:
      // apply the same guardrails as any other shell path.
      const blocked = checkShellCommand(command);
      if (blocked) {
        return { output: `Blocked: ${blocked.reason}`, success: false };
      }
      const text = command + "\n";
      try {
        execFileSync(TMUX_BIN, ["send-keys", "-t", sessionName, "-l", text], {
          encoding: "utf8",
          timeout: 5000,
        });
        return { output: `Sent command to '${sessionName}': ${text.trim()}`, success: true, sessionName };
      } catch (e: any) {
        return { output: `Error sending to session: ${e.stderr || e.message}`, success: false };
      }
    }

    case "type": {
      if (!target) {
        return { output: "Error: session name required for 'type'", success: false };
      }
      const sessionName = validSessionName(target);
      if (!sessionName) {
        return { output: `Error: invalid session name '${target}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      const text = args?.join(" ") || "";
      try {
        execFileSync(TMUX_BIN, ["send-keys", "-t", sessionName, "-l", text], {
          encoding: "utf8",
          timeout: 5000,
        });
        return { output: `Typed into '${sessionName}': ${text}`, success: true, sessionName };
      } catch (e: any) {
        return { output: `Error typing to session: ${e.stderr || e.message}`, success: false };
      }
    }

    case "capture": {
      if (!target) {
        return { output: "Error: session name required for 'capture'", success: false };
      }
      const sessionName = validSessionName(target);
      if (!sessionName) {
        return { output: `Error: invalid session name '${target}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      try {
        const out = execFileSync(TMUX_BIN, [
          "capture-pane",
          "-t",
          sessionName,
          "-p",
          "-S",
          "-50",
        ], { encoding: "utf8", timeout: 5000 });
        return { output: out.trim(), success: true, sessionName };
      } catch (e: any) {
        return { output: `Error capturing session: ${e.stderr || e.message}`, success: false };
      }
    }

    case "snapshot": {
      if (!target) {
        return { output: "Error: session name required for 'snapshot'", success: false };
      }
      const sessionName = validSessionName(target);
      if (!sessionName) {
        return { output: `Error: invalid session name '${target}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      try {
        const out = execFileSync(TMUX_BIN, [
          "capture-pane",
          "-t",
          sessionName,
          "-p",
          "-S",
          "-",
        ], { encoding: "utf8", timeout: 5000 });
        return { output: out.trim(), success: true, sessionName };
      } catch (e: any) {
        return { output: `Error snapshotting session: ${e.stderr || e.message}`, success: false };
      }
    }

    case "list": {
      try {
        const out = execFileSync(TMUX_BIN, ["list-sessions"], {
          encoding: "utf8",
          timeout: 5000,
        });
        return { output: out.trim(), success: true };
      } catch (e: any) {
        const stderr = (e.stderr || e.message || "").toLowerCase();
        // tmux exits 1 with "no server" when no sessions exist, and Node throws
        // ENOENT when tmux itself is not installed. Both mean "no active sessions",
        // so list never surfaces an error for the common empty/no-tmux case.
        if (
          e.status === 1 ||
          e.code === "ENOENT" ||
          stderr.includes("no server") ||
          stderr.includes("failed to connect") ||
          stderr.includes("error connecting") ||
          stderr.includes("no such file") ||
          stderr.includes("enoent")
        ) {
          return { output: "No active tmux sessions", success: true };
        }
        return { output: `Error listing sessions: ${e.stderr || e.message}`, success: false };
      }
    }

    case "kill":
    case "close": {
      if (!target) {
        return { output: "Error: session name required for 'kill'", success: false };
      }
      const sessionName = validSessionName(target);
      if (!sessionName) {
        return { output: `Error: invalid session name '${target}'. Use alphanumeric, dots, dashes, underscores only.`, success: false };
      }
      try {
        execFileSync(TMUX_BIN, ["kill-session", "-t", sessionName], {
          encoding: "utf8",
          timeout: 5000,
        });
        return { output: `Session '${sessionName}' terminated`, success: true, sessionName };
      } catch (e: any) {
        return { output: `Error killing session: ${e.stderr || e.message}`, success: false };
      }
    }

    default:
      return {
        output: `Unknown action: '${action}'. Supported: launch, send, type, capture, snapshot, list, kill, close`,
        success: false,
      };
  }
}
