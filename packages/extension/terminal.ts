import { execFileSync, spawn } from "node:child_process";

export async function spawnTerminal(cmd: string, cwd: string): Promise<string> {
  const terms: [string, string[]][] = [
    ["ghostty", ["-e", cmd]],
    ["kitty", ["-e", cmd]],
    ["alacritty", ["-e", cmd]],
  ];

  for (const [bin, args] of terms) {
    const started = await new Promise<boolean>((resolve) => {
      try {
        const child = spawn(bin, args, { cwd, detached: true, stdio: "ignore" });
        let settled = false;
        const timer = setTimeout(() => {
          // Survived the early-exit window: the emulator is still running.
          if (!settled) { settled = true; child.unref(); resolve(true); }
        }, 300);
        child.once("spawn", () => {
          // 'spawn' only means the process was created; wait out the window
          // so an emulator that exits immediately counts as a failed start.
        });
        child.once("exit", () => {
          if (!settled) { settled = true; clearTimeout(timer); resolve(false); }
        });
        child.once("error", () => {
          if (!settled) { settled = true; clearTimeout(timer); resolve(false); }
        });
      } catch {
        resolve(false);
      }
    });
    if (started) return `Gestart in een nieuw ${bin}-venster.`;
  }

  try {
    execFileSync("tmux", ["new-session", "-d", "-s", "skill-studio", "-c", cwd, cmd], {
      encoding: "utf8",
      timeout: 5000,
    });
    return "Geen terminal-emulator gevonden; gestart in tmux-sessie 'skill-studio'.";
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    return `Kon de app niet starten: ${err.stderr || err.message}`;
  }
}
