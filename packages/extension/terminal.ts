import { execFileSync, spawn } from "node:child_process";

export async function spawnTerminal(cmd: string, cwd: string): Promise<string> {
  const terms: Array<[string, string[]]> = [
    ["ghostty", ["-e", cmd]],
    ["kitty", ["-e", cmd]],
    ["alacritty", ["-e", cmd]],
  ];

  for (const [bin, args] of terms) {
    const started = await new Promise<boolean>((resolve) => {
      try {
        const child = spawn(bin, args, { cwd, detached: true, stdio: "ignore" });
        child.once("spawn", () => {
          child.unref();
          resolve(true);
        });
        child.once("error", () => resolve(false));
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
  } catch (e: any) {
    return `Kon de app niet starten: ${e.stderr || e.message}`;
  }
}
