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

  if (!command) return null;

  if (["bash", "shell", "terminal", "exec"].some((t) => toolName.includes(t))) {
    // ⚡ Bolt Optimization: Defer toLowerCase() until we verify this is a shell tool, saving string allocations for other tools.
    const lower = command.toLowerCase();
    if (/rm\s+-rf\s+(\/|~|\.\.|\*|\.\/?(\s|$))/.test(lower)) {
      return { block: true, reason: "Blocked destructive rm -rf pattern. Narrow the target path and explain why deletion is required." };
    }
    if (/\.env(\s|$)/.test(lower) && /(cat|sed|grep|cp|mv|rm|>|tee)/.test(lower)) {
      return { block: true, reason: "Blocked direct .env manipulation/read. Use a redacted config example instead." };
    }
    if (lower.includes("tctl launch") && !lower.includes("--repo-root")) {
      return { block: true, reason: "Sessions launched via tctl must include --repo-root so captures are reproducible." };
    }
    if (lower.includes("tctl launch") && lower.includes("--backend tuistory")) {
      const hasForceColor = lower.includes("force_color=3");
      const hasTrueColor = lower.includes("colorterm=truecolor");
      if (!hasForceColor || !hasTrueColor) {
        return { block: true, reason: "tuistory launches must include --env FORCE_COLOR=3 --env COLORTERM=truecolor to preserve colors in recordings." };
      }
    }
    if (/169\.254\.169\.254/.test(lower)) {
      return { block: true, reason: "Blocked access to cloud metadata IP (169.254.169.254). Internal metadata retrieval is prohibited." };
    }
    if (/(docker\s+run|docker\s+exec)\s+.*(--privileged|--pid(=|\s+)host|--network(=|\s+)host|(-v|--volume)(=|\s+)\/)/.test(lower)) {
      return { block: true, reason: "Blocked privileged docker escape pattern. Use --cap-add for specific capabilities instead." };
    }
    if (/curl\s+.*\|\s*(bash|sh)\s*$/.test(lower) && /(bit\.ly|tinyurl|pastebin|raw\.githubusercontent)/.test(lower)) {
      return { block: true, reason: "Blocked curl-pipe-to-shell from URL shortener or raw content host. Download and verify the script first." };
    }
    if (/(export|set)\s+\w+=\$\(.*\)/.test(lower) && /(cat|curl|wget|nc|ncat)/.test(lower)) {
      return { block: true, reason: "Blocked inline env-var exfiltration via command substitution. Set env vars from known values only." };
    }
  }

  return null;
}
