import { SKILL_NAMES, type RouteDecision, type ControlSkillName } from "./schema.ts";

// ⚡ Bolt Optimization: Cache word-boundary regular expressions so they are only compiled once per session.
const regexCache = new Map<string, RegExp>();

function has(text: string, terms: string[]) {
  const t = text.toLowerCase();
  return terms.some((term) => {
    if (term.includes(" ")) return t.includes(term);
    let re = regexCache.get(term);
    if (!re) {
      re = new RegExp(`\\b${term}\\b`);
      regexCache.set(term, re);
    }
    return re.test(t);
  });
}

export function routeControlTask(task: string, deliverableHint = ""): RouteDecision {
  const input = `${task} ${deliverableHint}`.toLowerCase();
  const skills: ControlSkillName[] = ["pi-agent-control"];
  const warnings: string[] = [];
  let driver: RouteDecision["driver"] = "tuistory";
  let capture: RouteDecision["capture"] = "report";
  let deliverable: RouteDecision["deliverable"] = "proof-report";

  if (has(input, ["browser", "web", "electron", "dom manipulation", "dom element", "screenshot", "visual qa"])) {
    driver = "agent-browser";
    skills.push("agent-browser");
    capture = "screenshots";
    deliverable = "browser-proof";
  }

  if (has(input, ["real terminal", "ghostty", "kitty", "wezterm", "key encoding", "escape sequence", "true input", "keyboard encoding"])) {
    driver = "true-input";
    skills.push("true-input", "pty-capture");
    capture = "mp4";
  }

  if (has(input, ["tui", "terminal", "cli tool", "cli app", "tctl", "snapshot", "escape key", "ink framework"])) {
    if (driver !== "true-input" && driver !== "agent-browser") driver = "tuistory";
    skills.push("tuistory", "capture");
    capture = capture === "report" ? "cast" : capture;
  }

  if (has(input, ["video", "showcase", "demo", "before/after", "before after", "side-by-side", "side by side", "mp4"])) {
    deliverable = "showcase-video";
    skills.push("showcase", "compose", "verify");
    if (capture === "report") capture = "cast";
  }

  if (has(input, ["qa", "test matrix", "regression", "checklist"])) {
    deliverable = "qa-report";
    skills.push("verify");
  }

  if (has(input, ["tctl", "pi agent", "pi cli", "pi coding", "control cli"])) {
    skills.push("pi-agent-cli");
  }

  if (has(input, ["initialize workspace", "setup workspace", "workspace init", "onboard", "scaffold"])) {
    skills.push("init", "wiki");
    driver = "mixed";
  }

  if (has(input, ["wiki", "document", "architecture map"])) {
    skills.push("wiki");
    driver = "mixed";
  }

  if (has(input, ["review", "audit", "guardrail", "safety"])) {
    skills.push("review", "session-navigation");
    driver = "mixed";
  }

  if (has(input, ["research", "optimize", "investigate", "subagent"])) {
    skills.push("autoresearch", "session-navigation");
    driver = "mixed";
  }

  if (has(input, ["analyze and improve", "full improvement", "chain skills"])) {
    skills.push("init", "wiki", "review", "autoresearch");
    driver = "mixed";
  }


  if (driver === "tuistory" && !has(input, ["force_color", "colorterm", "truecolor"])) {
    warnings.push("For tuistory captures, launch with FORCE_COLOR=3 and COLORTERM=truecolor so Ink/chalk output keeps color.");
  }
  if (has(input, ["tctl"]) && !has(input, ["repo-root", "worktree"])) {
    warnings.push("tctl launches require --repo-root; sessions should refuse without it.");
  }

  const uniqueSkills = Array.from(new Set(skills)).filter((s): s is ControlSkillName => (SKILL_NAMES as readonly string[]).includes(s));
  const recipe = buildRecipe(driver, deliverable, capture);

  return { driver, skills: uniqueSkills, capture, deliverable, warnings, recipe };
}

function buildRecipe(driver: RouteDecision["driver"], deliverable: RouteDecision["deliverable"], capture: RouteDecision["capture"]): string[] {
  const steps = [
    "Create a run directory: RUN_DIR=artifacts/runs/<timestamp>-<slug> and record commitments before touching the target.",
    "Load the routed skill atoms and keep the original skill names in the transcript for auditability.",
  ];

  if (driver === "agent-browser") {
    steps.push("Use agent-browser open/snapshot/click/fill/wait loops; re-snapshot after every navigation because refs invalidate.");
    steps.push("Capture screenshots or webm clips at each proof point.");
  } else if (driver === "true-input") {
    steps.push("Use true-input when the claim depends on real terminal keyboard encoding or terminal emulator behavior.");
    steps.push("Collect PTY bytes or VM screenshots and preserve raw logs under evidence/.");
  } else if (driver === "mixed") {
    steps.push("Use subagents and chained orchestration (e.g., init -> wiki -> review -> autoresearch) to complete complex logical goals.");
  } else {
    steps.push("Use tctl with backend tuistory for deterministic TUI automation and text snapshots.");
    steps.push("Launch with --cols 120 --rows 36 plus --env FORCE_COLOR=3 --env COLORTERM=truecolor.");
  }

  if (deliverable === "showcase-video") {
    steps.push("Compose with Remotion using the showcase atom; verify ffprobe, duration, resolution, and visible commitments.");
  } else if (deliverable === "qa-report") {
    steps.push("Write a QA table with step, expected, observed, PASS/FAIL, and evidence path.");
  } else {
    steps.push("Write a proof report that ties each claim to snapshot/screenshot/video evidence.");
  }

  if (capture !== "report") {
    steps.push(`Expected capture artifact type: ${capture}.`);
  }

  steps.push("Run final verification before declaring completion; failed commitments must loop back to capture or compose.");
  return steps;
}

export function renderRoute(decision: RouteDecision) {
  return [
    `Driver: ${decision.driver}`,
    `Deliverable: ${decision.deliverable}`,
    `Capture: ${decision.capture}`,
    `Skills: ${decision.skills.join(", ")}`,
    decision.warnings.length ? `Warnings:\n${decision.warnings.map((w) => `- ${w}`).join("\n")}` : "Warnings: none",
    `Recipe:\n${decision.recipe.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
  ].join("\n\n");
}
