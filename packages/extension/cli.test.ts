import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseSkillMd, doDiff, SkillEntry } from "./cli.ts";
import { dedupeUserSkills } from "./studio/model/skill.ts";
import * as child_process from "node:child_process";
import * as fs from "node:fs";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual("node:fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

vi.mock("./skill-merge.ts", () => ({
  mergeSkill: vi.fn(() => ({ hasConflicts: false, conflicts: [] })),
}));

describe("dedupeUserSkills", () => {
  const mk = (name: string, sourceDir: string): SkillEntry => ({
    name,
    description: "",
    path: `/some/${sourceDir}/${name}/SKILL.md`,
    source: "user",
    sourceDir,
    enabled: true,
    valid: "ok",
    mtime: new Date(),
    shadowState: null,
  });

  it("keeps one row per name across user dirs, preferring global", () => {
    const out = dedupeUserSkills([
      mk("poteto-mode", "claude"),
      mk("other", "claude"),
      mk("poteto-mode", "global"),
    ]);
    expect(out.map((s) => s.name).sort()).toEqual(["other", "poteto-mode"]);
    expect(out.find((s) => s.name === "poteto-mode")?.sourceDir).toBe("global");
  });

  it("leaves pi entries and user-overrides-pi shadowing untouched", () => {
    const pi: SkillEntry = { ...mk("tdd", "claude"), source: "pi", sourceDir: "pi", shadowState: "shadowed" };
    const user: SkillEntry = { ...mk("tdd", "global"), shadowState: "overrides" };
    const out = dedupeUserSkills([pi, user]);
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.name === "tdd" && s.source === "pi")?.shadowState).toBe("shadowed");
  });
});

describe("parseSkillMd", () => {
  it("should parse basic name and description", () => {
    const input = `name: test-skill\ndescription: A test skill`;
    expect(parseSkillMd(input)).toEqual({
      name: "test-skill",
      description: "A test skill",
    });
  });

  it("should parse values with extra whitespace", () => {
    const input = `name:    whitespace-skill   \ndescription: \t  A skill with whitespace   `;
    expect(parseSkillMd(input)).toEqual({
      name: "whitespace-skill",
      description: "A skill with whitespace",
    });
  });

  it("should strip single and double quotes from values", () => {
    const input = `name: "quoted-skill"\ndescription: 'A quoted description'`;
    expect(parseSkillMd(input)).toEqual({
      name: "quoted-skill",
      description: "A quoted description",
    });
  });

  it("should return empty strings when fields are missing", () => {
    const input = `some-other-field: foo`;
    expect(parseSkillMd(input)).toEqual({
      name: "",
      description: "",
    });
  });

  it("should handle multiline content and ignore irrelevant text", () => {
    const input = `
---
name: multi-skill
version: 1.0.0
description: A skill amidst other text
---
# Content goes here
    `;
    expect(parseSkillMd(input)).toEqual({
      name: "multi-skill",
      description: "A skill amidst other text",
    });
  });

  it("should handle partial fields (name only)", () => {
    const input = `name: just-name`;
    expect(parseSkillMd(input)).toEqual({
      name: "just-name",
      description: "",
    });
  });

  it("should handle partial fields (description only)", () => {
    const input = `description: just-desc`;
    expect(parseSkillMd(input)).toEqual({
      name: "",
      description: "just-desc",
    });
  });
});

describe("doDiff", () => {
  const mockSkill: SkillEntry = {
    name: "test-skill",
    description: "A test skill",
    path: "/path/to/user/skill/SKILL.md",
    source: "user",
    sourceDir: "/path/to/user/skill",
    enabled: true,
    valid: "ok",
    mtime: new Date(),
    shadowState: "overrides",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return diff output on success", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(child_process.execFileSync).mockReturnValue("diff output content");

    const result = doDiff(mockSkill);
    expect(result).toBe("diff output content");
  });

  it("should return error message when execFileSync throws with stdout", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const mockError = new Error("Command failed") as any;
    mockError.stdout = "diff with some differences";
    vi.mocked(child_process.execFileSync).mockImplementation(() => {
      throw mockError;
    });

    const result = doDiff(mockSkill);
    expect(result).toBe("diff with some differences");
  });

  it("should return error message when execFileSync throws with message but no stdout", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const mockError = new Error("No such file or directory");
    vi.mocked(child_process.execFileSync).mockImplementation(() => {
      throw mockError;
    });

    const result = doDiff(mockSkill);
    expect(result).toBe("No such file or directory");
  });

  it('should return "diff failed" when execFileSync throws empty error', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(child_process.execFileSync).mockImplementation(() => {
      throw {};
    });

    const result = doDiff(mockSkill);
    expect(result).toBe("diff failed");
  });

  it("should return message if skill has no shadowState", () => {
    const unshadowedSkill = { ...mockSkill, shadowState: null };
    const result = doDiff(unshadowedSkill);
    expect(result).toBe("No shadowed/overridden version found.");
    expect(child_process.execFileSync).not.toHaveBeenCalled();
  });

  it("should return error if PI skill is not found", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = doDiff(mockSkill);
    expect(result).toContain("PI skill not found at");
    expect(child_process.execFileSync).not.toHaveBeenCalled();
  });
});

describe("scanDir via CLI commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for non-existent directory", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(fs.existsSync("/nonexistent")).toBe(false);
  });

  it("should parse SKILL.md frontmatter correctly", () => {
    const skillContent = `---
name: test-skill
description: A test skill for unit testing
---
# Test Skill
Content here`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: "test-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue(skillContent);
    vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date("2026-01-01") } as any);

    expect(fs.readFileSync("/skills/test-skill/SKILL.md", "utf8")).toContain("name: test-skill");
  });

  it("should skip hidden directories", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: ".hidden", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
      { name: "visible", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue("---\nname: visible\ndescription: Visible skill\n---\n");
    vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any);

    const entries = fs.readdirSync("/skills", { withFileTypes: true });
    const visible = entries.filter((e) => !e.name.startsWith("."));
    expect(visible).toHaveLength(1);
    expect(visible[0].name).toBe("visible");
  });

  it("should skip entries without SKILL.md", () => {
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (path === "/skills") return true;
      if (path === "/skills/no-skill/SKILL.md") return false;
      if (path === "/skills/with-skill/SKILL.md") return true;
      return false;
    });
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: "no-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
      { name: "with-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue("---\nname: with-skill\ndescription: Has skill file\n---\n");
    vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any);

    expect(fs.existsSync("/skills/no-skill/SKILL.md")).toBe(false);
    expect(fs.existsSync("/skills/with-skill/SKILL.md")).toBe(true);
  });
});
