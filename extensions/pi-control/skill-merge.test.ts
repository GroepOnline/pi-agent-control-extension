import { describe, it, expect, vi } from "vitest";
import { listMergeStates, checkSkillUpdateConflict, resolveMerge, mergeSkill } from "./skill-merge.ts";

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
});
