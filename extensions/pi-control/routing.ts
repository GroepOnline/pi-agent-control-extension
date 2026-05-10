import { SKILL_NAMES, type RouteDecision, type ControlSkillName } from "./schema.ts";

function has(text: string, terms: string[]) {
  const t = text.toLowerCase();
  return terms.some((term) => t.includes(term));
}

export function routeControlTask(task: string, deliverableHint = ""): RouteDecision {
  const input = `${task} ${deliverableHint}`.toLowerCase();
  const skills: ControlSkillName[] = ["pi-agent-control"];
  const warnings: string[] = [];
  let driver: RouteDecision["driver"] = "tuistory";
  let capture: RouteDecision["capture"] = "report";
  let deliverable: RouteDecision["deliverable"] = "proof-report";

  if (has(input, ["browser", "web", "electron", "dom", "screenshot", "visual qa"])) {
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

  if (has(input, ["tui", "terminal", "cli", "droid-dev", "snapshot", "esc", "stream", "ink"])) {
    if (driver !== "true-input") driver = "tuistory";
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

  if (has(input, ["droid", "droid-dev", "tctl", "pi", "pi coding"])) {
    skills.push("pi-agent-cli");
  }

  // Meta/utility skills — add based on task type, independent of driver
  if (has(input, ["design", "ui", "frontend", "styling", "css", "layout", "landing page", "website design", "web design"])) {
    skills.push("frontend-design");
  }
  if (has(input, ["write", "text", "blog", "humanize", "prose", "edit writing", "rewrite", "copy", "slop"])) {
    skills.push("human-writing");
  }
  if (has(input, ["skill create", "new skill", "improve skill", "extract skill", "skill design"])) {
    skills.push("skill-creation");
  }
  if (has(input, ["image", "logo", "icon", "diagram", "flowchart", "presentation", "slides", "slide deck", "photo", "picture"])) {
    skills.push("visual-design");
  }
  if (has(input, ["wiki", "document", "architecture doc", "codebase doc", "generate doc"])) {
    skills.push("wiki");
  }
  if (has(input, ["init", "agents.md", "setup repo", "initialize", "project setup"])) {
    skills.push("init");
  }
  if (has(input, ["review", "pr review", "pull request", "code review", "diff"])) {
    skills.push("review");
  }
  if (has(input, ["session", "history", "search session", "past session", "previous session", "resume"])) {
    skills.push("session-navigation");
  }
  if (has(input, ["simplify", "refactor", "clean code", "cleanup", "code quality", "debloat"])) {
    skills.push("simplify");
  }
  if (has(input, ["autoresearch", "optimize", "benchmark", "experiment", "tune", "hyperparameter", "metric improve"])) {
    skills.push("autoresearch");
  }

  if (driver === "tuistory" && !has(input, ["force_color", "colorterm", "truecolor"])) {
    warnings.push("For tuistory captures, launch with FORCE_COLOR=3 and COLORTERM=truecolor so Ink/chalk output keeps color.");
  }
  if (has(input, ["droid-dev"]) && !has(input, ["repo-root", "worktree"])) {
    warnings.push("droid-dev launches require --repo-root; tctl should refuse without it.");
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
