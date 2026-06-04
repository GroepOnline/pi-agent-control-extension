import { SKILL_NAMES, type RouteDecision, type ControlSkillName } from "../types/schema.ts";

// ⚡ Bolt Optimization: Cache word-boundary regular expressions so they are only compiled once per session.
const regexCache = new Map<string, RegExp>();

// RULE PRIORITY (order matters - later rules can override earlier ones):
// 1. High-specificity drivers (browser, true-input) - checked first
// 2. Generic terminal/tui - checked second, overridden by (1)
// 3. Deliverable types (video, qa) - modify deliverable regardless of driver
// 4. Target-specific (pi-agent-cli, init, wiki) - add skills
// 5. Meta operations (review, research, meta-control) - override driver to "mixed"
// 6. Catch-all - ensures minimal skills are loaded for generic inputs
//
// NEGATIVE KEYWORDS: Prefix a keyword with "!" to exclude it.
// Example: keywords: ["terminal", "!browser"] matches "terminal" but NOT if "browser" is present.
// This is for rule authors to define exclusions, not for user input parsing.

function has(text: string, terms: string[]) {
  const t = text.toLowerCase();
  return terms.some((term) => {
    // Negative keyword support: !term means "must NOT contain term"
    if (term.startsWith("!")) {
      const negTerm = term.slice(1);
      if (negTerm.includes(" ")) return !t.includes(negTerm);
      let re = regexCache.get(negTerm);
      if (!re) {
        re = new RegExp(`\\b${negTerm}\\b`);
        regexCache.set(negTerm, re);
      }
      return !re.test(t);
    }
    // Positive keyword
    if (term.includes(" ")) return t.includes(term);
    let re = regexCache.get(term);
    if (!re) {
      re = new RegExp(`\\b${term}\\b`);
      regexCache.set(term, re);
    }
    return re.test(t);
  });
}

type RouteState = {
  driver: RouteDecision["driver"];
  capture: RouteDecision["capture"];
  deliverable: RouteDecision["deliverable"];
  skills: ControlSkillName[];
  warnings: string[];
};

type Rule = {
  keywords: string[];
  apply: (state: RouteState) => void;
};

const ROUTE_RULES: Rule[] = [
  {
    keywords: ["browser", "web", "electron", "dom manipulation", "dom element", "screenshot", "visual qa"],
    apply: (s) => { s.driver = "agent-browser"; s.skills.push("agent-browser"); s.capture = "screenshots"; s.deliverable = "browser-proof"; }
  },
  {
    keywords: ["real terminal", "ghostty", "kitty", "wezterm", "key encoding", "escape sequence", "true input", "keyboard encoding"],
    apply: (s) => { s.driver = "true-input"; s.skills.push("true-input", "pty-capture"); s.capture = "mp4"; }
  },
  {
    keywords: ["tui", "terminal", "cli tool", "cli app", "tctl", "snapshot", "escape key", "ink framework", "command", "shell", "bash", "script", "!browser", "!web"],
    apply: (s) => {
      if (s.driver !== "true-input" && s.driver !== "agent-browser") s.driver = "tuistory";
      s.skills.push("tuistory", "capture");
      s.capture = s.capture === "report" ? "cast" : s.capture;
    }
  },
  {
    keywords: ["video", "showcase", "demo", "before/after", "before after", "side-by-side", "side by side", "mp4"],
    apply: (s) => {
      s.deliverable = "showcase-video";
      s.skills.push("showcase", "compose", "verify");
      if (s.capture === "report") s.capture = "cast";
    }
  },
  {
    keywords: ["qa", "test matrix", "regression", "checklist"],
    apply: (s) => { s.deliverable = "qa-report"; s.skills.push("verify"); }
  },
  {
    keywords: ["tctl", "agy agent", "agy cli", "antigravity", "control cli", "pi agent", "pi cli", "pi coding"],
    apply: (s) => { s.skills.push("agy-agent-cli"); }
  },
  {
    keywords: ["initialize workspace", "setup workspace", "workspace init", "onboard", "scaffold"],
    apply: (s) => { s.skills.push("init", "wiki"); s.driver = "mixed"; }
  },
  {
    keywords: ["wiki", "document", "architecture map"],
    apply: (s) => { s.skills.push("wiki"); s.driver = "mixed"; }
  },
  {
    keywords: ["review", "audit", "guardrail", "safety"],
    apply: (s) => { s.skills.push("review", "session-navigation"); s.driver = "mixed"; }
  },
  {
    keywords: ["research", "optimize", "investigate", "subagent"],
    apply: (s) => { s.skills.push("autoresearch", "session-navigation"); s.driver = "mixed"; }
  },
  {
    keywords: ["analyze and improve", "full improvement", "chain skills"],
    apply: (s) => { s.skills.push("init", "wiki", "review", "autoresearch"); s.driver = "mixed"; }
  },
  {
    keywords: ["meta skill", "meta-skill", "chain", "pipeline", "workflow orchestrat"],
    apply: (s) => { s.skills.push("meta-control", "background-pty"); s.driver = "mixed"; }
  },
  {
    keywords: ["computer use", "os control", "os-control", "desktop automation", "x11", "wayland", "native input", "keyboard injection", "mouse injection"],
    apply: (s) => {
      s.driver = "agent-browser";
      s.skills.push("agent-browser", "background-pty");
      s.capture = "mp4";
      s.warnings.push("OS-level computer use is experimental. Prefer agent-browser for web UI automation.");
    }
  },
  {
    keywords: ["background pty", "background-pty", "detached session", "long running", "async workflow"],
    apply: (s) => {
      s.skills.push("background-pty");
      if (s.driver === "tuistory") s.capture = "cast";
    }
  },
  {
    keywords: ["e2e", "end-to-end", "end to end", "integration test", "user journey", "cross-service", "workflow test"],
    apply: (s) => {
      s.driver = "mixed";
    }
  },
  {
    keywords: ["ralph", "consensus", "ralplan", "review plan", "hardening review", "plan review"],
    apply: (s) => {
      s.skills.push("ralph");
      s.driver = "mixed";
    }
  },
  {
    keywords: ["create a plan", "plan this task", "break down this work", "implementation plan"],
    apply: (s) => {
      s.driver = "mixed";
    }
  },
  {
    keywords: ["architect review", "technical feasibility", "dependency analysis", "scalability assessment"],
    apply: (s) => {
      s.driver = "mixed";
    }
  },
  {
    keywords: ["critic review", "adversarial review", "challenge assumptions", "find weak spots"],
    apply: (s) => {
      s.driver = "mixed";
    }
  },
  {
    keywords: ["security review", "security check", "OWASP review", "security audit"],
    apply: (s) => {
      s.driver = "mixed";
    }
  },
  {
    keywords: ["run", "execute", "task", "do", "start", "launch"],
    apply: (s) => {
      // Catch-all: ensure default driver has its skills loaded for generic inputs
      if (s.driver === "tuistory" && !s.skills.includes("tuistory")) {
        s.skills.push("tuistory", "capture");
      }
    }
  }
];

export function routeControlTask(task: string, deliverableHint = ""): RouteDecision {
  const input = `${task} ${deliverableHint}`.toLowerCase();

  const state: RouteState = {
    driver: "tuistory",
    capture: "report",
    deliverable: "proof-report",
    skills: ["agy-agent-control"],
    warnings: []
  };

  for (const rule of ROUTE_RULES) {
    if (has(input, rule.keywords)) {
      rule.apply(state);
    }
  }

  if (state.driver === "tuistory" && !has(input, ["force_color", "colorterm", "truecolor"])) {
    state.warnings.push("For tuistory captures, launch with FORCE_COLOR=3 and COLORTERM=truecolor so Ink/chalk output keeps color.");
  }
  if (has(input, ["tctl"]) && !has(input, ["repo-root", "worktree"])) {
    state.warnings.push("tctl launches require --repo-root; sessions should refuse without it.");
  }

  const uniqueSkills = Array.from(new Set(state.skills)).filter((s): s is ControlSkillName => (SKILL_NAMES as readonly string[]).includes(s));
  const recipe = buildRecipe(state.driver, state.deliverable, state.capture, uniqueSkills);

  return { driver: state.driver, skills: uniqueSkills, capture: state.capture, deliverable: state.deliverable, warnings: state.warnings, recipe };
}

function buildRecipe(driver: RouteDecision["driver"], deliverable: RouteDecision["deliverable"], capture: RouteDecision["capture"], skills: ControlSkillName[]): string[] {
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
    if (skills.includes("ralph")) {
      steps.push("Use the ralph skill to orchestrate the Review-Approve Loop Protocol: invoke the Planner subagent to create/refine plan, then invoke Architect, Critic, and SecurityReviewer subagents for adversarial hardening, iterate until consensus or max 3 cycles.");
    } else {
      steps.push("Use subagents and chained orchestration: invoke Explorer, Planner, Architect, Critic, SecurityReviewer, Executor, or E2ETester depending on the target task.");
    }
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
