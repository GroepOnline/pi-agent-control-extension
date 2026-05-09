export const SKILL_NAMES = [
  "agent-browser",
  "capture",
  "compose",
  "pi-agent-cli",
  "pi-agent-control",
  "pty-capture",
  "showcase",
  "true-input",
  "tuistory",
  "verify",
] as const;

export type ControlSkillName = (typeof SKILL_NAMES)[number];

export type RouteDecision = {
  driver: "tuistory" | "true-input" | "agent-browser" | "mixed";
  skills: ControlSkillName[];
  capture: "cast" | "mp4" | "screenshots" | "report";
  deliverable: "qa-report" | "proof-report" | "showcase-video" | "browser-proof";
  warnings: string[];
  recipe: string[];
};

export const EVIDENCE_SCHEMA = `# Evidence Schema

Every control run should produce a run directory with:

- run.json: task, target, driver, dimensions, branch/worktree, timestamps
- transcript.md: human-readable action log
- evidence/: snapshots, screenshots, casts, mp4s, logs
- verification.md: commitments checked against visible evidence

Minimum proof item:

\`\`\`json
{
  "claim": "ESC cancels streaming in bash mode",
  "step": "press ESC during active stream",
  "driver": "tuistory or true-input",
  "evidence": ["snapshot-before.txt", "snapshot-after.txt"],
  "result": "pass | fail",
  "reason": "observable state changed / did not change"
}
\`\`\`
`;
