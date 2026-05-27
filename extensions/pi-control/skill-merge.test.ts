import { describe, it, expect, vi } from "vitest";
import { listMergeStates, checkSkillUpdateConflict, resolveMerge, mergeSkill, threeWayMerge } from "./skill-merge.ts";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    readFileSync: vi.fn((path: string, encoding: BufferEncoding) => {
      if (path.includes("skill-studio.json")) return "{\"merges\":{}}";
      if (path.includes("SKILL.md")) return "name: test\ndescription: test desc\n";
      return actual.readFileSync(path, encoding);
    }),
    existsSync: vi.fn((path: string) => {
      if (path.includes("skill-studio.json")) return true;
      if (path.includes("agent-browser")) return true;
      return false;
    }),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(() => ({ mtimeMs: Date.now() } as any)),
  };
});

describe("listMergeStates", () => {
  it("returns empty array when no merges exist", () => {
    const states = listMergeStates();
    expect(states).toEqual([]);
  });
});

describe("checkSkillUpdateConflict", () => {
  it("returns no change when PI skill has no merge state", () => {
    const result = checkSkillUpdateConflict("agent-browser");
    expect(result.changed).toBe(false);
    expect(result.lastMergeMtime).toBeNull();
  });
});

describe("resolveMerge", () => {
  it("returns error when user skill not found", () => {
    const result = resolveMerge("nonexistent", "pi");
    expect(result.saved).toBe(false);
    expect(result.error).toContain("User skill not found");
  });
});

describe("mergeSkill edge cases", () => {
  it("returns not-found error for missing PI skill", () => {
    const result = mergeSkill("totally-missing-skill");
    expect(result.merged).toBe(false);
    expect(result.output).toContain("not found");
  });

  it("rejects path traversal in skill name", () => {
    const result = mergeSkill("../../etc/passwd");
    expect(result.merged).toBe(false);
    expect(result.output).toContain("Invalid skill name");
  });

  it("rejects absolute path in skill name", () => {
    const result = mergeSkill("/etc/passwd");
    expect(result.merged).toBe(false);
    expect(result.output).toContain("Invalid skill name");
  });
});

describe("threeWayMerge", () => {
  it("returns clean merge when both sides agree with base", () => {
    const base = ["name: test", "version: 1", "description: foo"];
    const pi = ["name: test", "version: 1", "description: foo"];
    const user = ["name: test", "version: 1", "description: foo"];
    const result = threeWayMerge(base, pi, user);
    expect(result.merged).toBe(true);
    expect(result.hasConflicts).toBe(false);
    expect(result.output).toContain("name: test");
  });

  it("auto-resolves when only PI changed a line", () => {
    const base = ["name: test", "version: 1"];
    const pi = ["name: test", "version: 2"];
    const user = ["name: test", "version: 1"];
    const result = threeWayMerge(base, pi, user);
    expect(result.merged).toBe(true);
    expect(result.output).toContain("version: 2");
  });

  it("auto-resolves when only user changed a line", () => {
    const base = ["name: test", "version: 1"];
    const pi = ["name: test", "version: 1"];
    const user = ["name: test", "version: 3"];
    const result = threeWayMerge(base, pi, user);
    expect(result.merged).toBe(true);
    expect(result.output).toContain("version: 3");
  });

  it("produces conflict markers when both sides diverged", () => {
    const base = ["name: test", "version: 1"];
    const pi = ["name: test", "version: 2"];
    const user = ["name: test", "version: 3"];
    const result = threeWayMerge(base, pi, user);
    expect(result.merged).toBe(false);
    expect(result.hasConflicts).toBe(true);
    expect(result.output).toContain("<<<<<<< PI");
    expect(result.output).toContain("=======");
    expect(result.output).toContain(">>>>>>> USER");
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].line).toBe(2);
  });

  it("handles files with different lengths", () => {
    const base = ["a", "b"];
    const pi = ["a", "b", "c"];
    const user = ["a", "b"];
    const result = threeWayMerge(base, pi, user);
    expect(result.merged).toBe(true);
    expect(result.output).toContain("c");
  });

  it("handles empty files gracefully", () => {
    const result = threeWayMerge([], [], []);
    expect(result.merged).toBe(true);
    expect(result.output).toBe("");
  });
});

describe("checkSkillUpdateConflict security", () => {
  it("rejects path traversal skill names", () => {
    const result = checkSkillUpdateConflict("../malicious");
    expect(result.changed).toBe(false);
    expect(result.lastPiMtime).toBe(0);
  });
});

describe("resolveMerge security", () => {
  it("rejects path traversal skill names", () => {
    const result = resolveMerge("../malicious", "pi");
    expect(result.saved).toBe(false);
    expect(result.error).toContain("Invalid skill name");
  });
});
