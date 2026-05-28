import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { rootDir } from "./utils.ts";

export interface MergeConflict {
  line: number;
  piLine: string;
  userLine: string;
  context: string;
}

export interface MergeResult {
  merged: boolean;
  output: string;
  conflicts: MergeConflict[];
  hasConflicts: boolean;
}

export interface MergeState {
  name: string;
  mergedAt: string;
  conflictCount: number;
  autoResolved: number;
  manualRequired: number;
}

const MERGE_STATE_PATH = join(homedir(), ".config", "devin", "skill-studio.json");
const VALID_SKILL_NAME = /^[a-zA-Z0-9_-]+$/;

export function isValidSkillName(name: string): boolean {
  return VALID_SKILL_NAME.test(name) && !name.includes("..") && !name.startsWith("/");
}

function loadMergeState(): Map<string, MergeState> {
  try {
    const raw = readFileSync(MERGE_STATE_PATH, "utf8");
    const data = JSON.parse(raw);
    if (data.merges && typeof data.merges === "object") {
      return new Map(Object.entries(data.merges));
    }
  } catch { /* ignore */ }
  return new Map();
}

function saveMergeState(merges: Map<string, MergeState>) {
  try {
    mkdirSync(dirname(MERGE_STATE_PATH), { recursive: true });
    const raw = existsSync(MERGE_STATE_PATH) ? readFileSync(MERGE_STATE_PATH, "utf8") : "{}";
    const data = JSON.parse(raw);
    data.merges = Object.fromEntries(merges);
    writeFileSync(MERGE_STATE_PATH, JSON.stringify(data, null, 2));
  } catch { /* ignore */ }
}

/**
 * Naive line-by-line 3-way merge. Assumes files are reasonably aligned.
 * For well-structured SKILL.md files with frontmatter this works well.
 * Falls back to conflict markers when both sides diverged from base.
 */
export function threeWayMerge(baseLines: string[], piLines: string[], userLines: string[]): MergeResult {
  const conflicts: MergeConflict[] = [];
  const output: string[] = [];

  // Simple approach: compare base vs PI and base vs user line-by-line
  const maxLen = Math.max(piLines.length, userLines.length);
  let autoResolved = 0;

  for (let i = 0; i < maxLen; i++) {
    const piLine = piLines[i] ?? "";
    const userLine = userLines[i] ?? "";
    const baseLine = baseLines[i] ?? "";

    if (piLine === userLine) {
      output.push(piLine);
      autoResolved++;
    } else if (piLine === baseLine) {
      // Only user changed this line
      output.push(userLine);
      autoResolved++;
    } else if (userLine === baseLine) {
      // Only PI changed this line
      output.push(piLine);
      autoResolved++;
    } else {
      // Both changed — conflict
      output.push(`<<<<<<< PI`);
      output.push(piLine);
      output.push(`=======`);
      output.push(userLine);
      output.push(`>>>>>>> USER`);
      conflicts.push({
        line: i + 1,
        piLine,
        userLine,
        context: `Line ${i + 1} diverged`,
      });
    }
  }

  return {
    merged: conflicts.length === 0,
    output: output.join("\n"),
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
}

export function mergeSkill(name: string): MergeResult & { state: MergeState } {
  if (!isValidSkillName(name)) {
    return {
      merged: false,
      output: `Invalid skill name "${name}". Use only letters, numbers, hyphens, and underscores.`,
      conflicts: [],
      hasConflicts: false,
      state: { name, mergedAt: new Date().toISOString(), conflictCount: 0, autoResolved: 0, manualRequired: 0 },
    };
  }
  const repoRoot = rootDir();
  const piPath = join(repoRoot, "skills", name, "SKILL.md");
  const userPaths = [
    join(homedir(), ".agents", "skills", name, "SKILL.md"),
    join(homedir(), ".devin", "skills", name, "SKILL.md"),
    join(homedir(), ".claude", "skills", name, "SKILL.md"),
  ];

  if (!existsSync(piPath)) {
    return {
      merged: false,
      output: `PI skill "${name}" not found at ${piPath}`,
      conflicts: [],
      hasConflicts: false,
      state: { name, mergedAt: new Date().toISOString(), conflictCount: 0, autoResolved: 0, manualRequired: 0 },
    };
  }

  const userPath = userPaths.find((p) => existsSync(p));
  if (!userPath) {
    return {
      merged: false,
      output: `User skill "${name}" not found in any user skill directory.`,
      conflicts: [],
      hasConflicts: false,
      state: { name, mergedAt: new Date().toISOString(), conflictCount: 0, autoResolved: 0, manualRequired: 0 },
    };
  }

  const piContent = readFileSync(piPath, "utf8");
  const userContent = readFileSync(userPath, "utf8");

  // Try to get a common ancestor via git if available
  let baseContent = piContent; // fallback: PI as base
  try {
    const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] }).trim();
    const relPi = piPath.slice(gitRoot.length + 1);
    const common = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { encoding: "utf8", cwd: gitRoot, stdio: ["ignore", "pipe", "pipe"] }).trim();
    baseContent = execFileSync("git", ["show", `${common}:${relPi}`], { encoding: "utf8", cwd: gitRoot, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    // fallback: use PI version as base (conservative)
  }

  const baseLines = baseContent.split("\n");
  const piLines = piContent.split("\n");
  const userLines = userContent.split("\n");

  const result = threeWayMerge(baseLines, piLines, userLines);

  const state: MergeState = {
    name,
    mergedAt: new Date().toISOString(),
    conflictCount: result.conflicts.length,
    autoResolved: result.merged ? Math.max(piLines.length, userLines.length) : Math.max(piLines.length, userLines.length) - result.conflicts.length,
    manualRequired: result.conflicts.length,
  };

  const merges = loadMergeState();
  merges.set(name, state);
  saveMergeState(merges);

  return { ...result, state };
}

export function getMergeState(name: string): MergeState | undefined {
  return loadMergeState().get(name);
}

export function hasMergeState(name: string): boolean {
  return loadMergeState().has(name);
}

export function resolveMerge(name: string, resolution: "pi" | "user" | "manual", manualContent?: string): { saved: boolean; path: string; error?: string } {
  if (!isValidSkillName(name)) {
    return { saved: false, path: "", error: `Invalid skill name "${name}"` };
  }
  const repoRoot = rootDir();
  const piPath = join(repoRoot, "skills", name, "SKILL.md");
  const userPaths = [
    join(homedir(), ".agents", "skills", name, "SKILL.md"),
    join(homedir(), ".devin", "skills", name, "SKILL.md"),
    join(homedir(), ".claude", "skills", name, "SKILL.md"),
  ];

  const userPath = userPaths.find((p) => existsSync(p));
  if (!userPath) return { saved: false, path: "", error: "User skill not found" };

  const destDir = join(homedir(), ".devin", "skills", name);
  const dest = join(destDir, "SKILL.md");

  try {
    mkdirSync(destDir, { recursive: true });

    if (resolution === "pi") {
      const content = readFileSync(piPath, "utf8");
      writeFileSync(dest, content);
    } else if (resolution === "user") {
      const content = readFileSync(userPath!, "utf8");
      writeFileSync(dest, content);
    } else if (resolution === "manual" && manualContent) {
      writeFileSync(dest, manualContent);
    } else {
      return { saved: false, path: dest, error: "No content provided for manual resolution" };
    }

    return { saved: true, path: dest };
  } catch (e: any) {
    return { saved: false, path: dest, error: e.message };
  }
}

export function listMergeStates(): MergeState[] {
  return Array.from(loadMergeState().values());
}

export function checkSkillUpdateConflict(name: string): { changed: boolean; lastPiMtime: number; lastMergeMtime: string | null } {
  if (!isValidSkillName(name)) return { changed: false, lastPiMtime: 0, lastMergeMtime: null };
  const repoRoot = rootDir();
  const piPath = join(repoRoot, "skills", name, "SKILL.md");
  if (!existsSync(piPath)) return { changed: false, lastPiMtime: 0, lastMergeMtime: null };

  const piMtime = statSync(piPath).mtimeMs;
  const state = getMergeState(name);
  if (!state) return { changed: false, lastPiMtime: piMtime, lastMergeMtime: null };

  const mergeTime = new Date(state.mergedAt).getTime();
  return {
    changed: piMtime > mergeTime,
    lastPiMtime: piMtime,
    lastMergeMtime: state.mergedAt,
  };
}
