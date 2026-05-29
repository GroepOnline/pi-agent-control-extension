function getCommand(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  for (const key of ["command", "cmd", "script", "code", "expression", "args", "input", "payload", "data", "body"]) {
    if (typeof obj[key] === "string") return obj[key] as string;
  }
  return "";
}

export function inspectToolCall(event: any) {
  const toolName = String(event?.toolName ?? event?.name ?? "").toLowerCase();
  const command = getCommand(event?.input ?? event?.params);

  if (!command) return null;

  if (["bash", "shell", "terminal", "exec"].some((t) => toolName.includes(t))) {
    const lower = command.toLowerCase();

    // Destructive filesystem commands
    if (/rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|--recursive|--force)\s/.test(lower) ||
        /rm\s+-rf?\s+(\/|~|\.\.|\*|\.\/?(\s|$))/.test(lower)) {
      return { block: true, reason: "Blocked destructive rm pattern. Narrow the target path and explain why deletion is required." };
    }

    // .env file access (broadened to cover .env.local, .env.production, etc.)
    if (/\.env[\w.]*(\s|$|\/)/.test(lower) && /(cat|sed|grep|cp|mv|rm|>|tee|head|tail|base64|diff|less|more|nano|vi|vim)/.test(lower)) {
      return { block: true, reason: "Blocked direct .env manipulation/read. Use a redacted config example instead." };
    }

    // tctl session reproducibility
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

    // Cloud metadata access
    if (/169\.254\.169\.254/.test(lower)) {
      return { block: true, reason: "Blocked access to cloud metadata IP (169.254.169.254). Internal metadata retrieval is prohibited." };
    }

    // Privileged docker escape
    if (/(docker\s+run|docker\s+exec)\s+.*(--privileged|--pid(=|\s+)host|--network(=|\s+)host|(-v|--volume)(=|\s+)\/)/.test(lower)) {
      return { block: true, reason: "Blocked privileged docker escape pattern. Use --cap-add for specific capabilities instead." };
    }

    // Curl/wget piped to shell — block ALL instances, not just specific domains
    if (/(curl|wget|fetch)\s.*\|\s*(bash|sh|zsh|python3?|node|perl|ruby|php)\s*$/.test(lower)) {
      return { block: true, reason: "Blocked curl/wget-pipe-to-shell. Download and verify the script before execution." };
    }

    // Inline env-var exfiltration via command substitution
    if (/(export|set)\s+\w+=\$\(.*\)/.test(lower) && /(cat|curl|wget|nc|ncat)/.test(lower)) {
      return { block: true, reason: "Blocked inline env-var exfiltration via command substitution. Set env vars from known values only." };
    }

    // Dangerous standalone commands
    if (/\b(wget|nc|ncat|socat)\b/.test(lower) && !lower.includes("wget -q") && !lower.includes("--spider")) {
      return { block: true, reason: "Blocked network utility (wget/nc/ncat/socat). Use approved download methods instead." };
    }

    // Privilege escalation / permission changes
    if (/\b(chmod|chown|chgrp)\s+/.test(lower) && /(777|666|\+s|a\+w)/.test(lower)) {
      return { block: true, reason: "Blocked dangerous permission change (777/setuid/world-writable). Use least-privilege permissions." };
    }

    // Raw disk operations
    if (/\bdd\s+/.test(lower) && /(of=\/dev|if=\/dev|bs=)/.test(lower)) {
      return { block: true, reason: "Blocked raw disk operation (dd). Direct disk access is prohibited." };
    }

    // Inline code execution
    if (/\b(python3?\s+-c|node\s+-e|perl\s+-e|ruby\s+-e|php\s+-r)\b/.test(lower)) {
      return { block: true, reason: "Blocked inline code execution. Write to a file and execute the file instead." };
    }

    // Reverse shell patterns
    if (/\b(bash\s+-i|\/dev\/(tcp|udp)|mkfifo|nc\s+-e|ncat\s+-e|socat\s+.*exec)\b/.test(lower)) {
      return { block: true, reason: "Blocked reverse shell pattern. Use approved remote access methods." };
    }

    // Base64 decode piped to shell
    if (/base64\s+(-d|--decode)\s*\|\s*(sh|bash|zsh|python|node|perl|ruby|php)/.test(lower)) {
      return { block: true, reason: "Blocked base64-decoded execution. Decode to a file and review before running." };
    }

    // eval/source of untrusted content
    if (/\beval\s+/.test(lower) && /(\$|`|\\)/.test(lower)) {
      return { block: true, reason: "Blocked eval with dynamic content. Use explicit function calls instead." };
    }
  }

  return null;
}
