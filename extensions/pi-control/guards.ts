function getCommand(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  for (const key of ["command", "cmd", "script"]) {
    if (typeof obj[key] === "string") return obj[key] as string;
  }
  return "";
}

export function inspectToolCall(event: any) {
  const toolName = String(event?.toolName ?? event?.name ?? "").toLowerCase();
  const command = getCommand(event?.input ?? event?.params);
  const lower = command.toLowerCase();

  if (!command) return null;

  if (["bash", "shell", "terminal", "exec"].some((t) => toolName.includes(t))) {
    if (/rm\s+-rf\s+(\/|~|\.\.|\*)/.test(lower)) {
      return { block: true, reason: "Blocked destructive rm -rf pattern. Narrow the target path and explain why deletion is required." };
    }
    if (/\.env(\s|$)/.test(lower) && /(cat|sed|grep|cp|mv|rm|>|tee)/.test(lower)) {
      return { block: true, reason: "Blocked direct .env manipulation/read. Use a redacted config example instead." };
    }
    if (lower.includes("tctl launch") && lower.includes("droid-dev") && !lower.includes("--repo-root")) {
      return { block: true, reason: "droid-dev launches must include --repo-root so captures are reproducible." };
    }
    if (lower.includes("tctl launch") && lower.includes("--backend tuistory")) {
      const hasForceColor = lower.includes("force_color=3");
      const hasTrueColor = lower.includes("colorterm=truecolor");
      if (!hasForceColor || !hasTrueColor) {
        return { block: true, reason: "tuistory launches must include --env FORCE_COLOR=3 --env COLORTERM=truecolor to preserve colors in recordings." };
      }
    }
  }

  return null;
}
