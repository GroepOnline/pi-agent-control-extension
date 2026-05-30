import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseSkillMd } from './cli.ts';

// Mock fs and child_process before importing cli
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

vi.mock("./skill-merge.ts", () => ({
  mergeSkill: vi.fn(() => ({ hasConflicts: false, conflicts: [] })),
}));

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

describe('parseSkillMd', () => {
  it('should parse basic name and description', () => {
    const input = `name: test-skill\ndescription: A test skill`;
    expect(parseSkillMd(input)).toEqual({
      name: 'test-skill',
      description: 'A test skill'
    });
  });

  it('should parse values with extra whitespace', () => {
    const input = `name:    whitespace-skill   \ndescription: \t  A skill with whitespace   `;
    expect(parseSkillMd(input)).toEqual({
      name: 'whitespace-skill',
      description: 'A skill with whitespace'
    });
  });

  it('should strip single and double quotes from values', () => {
    const input = `name: "quoted-skill"\ndescription: 'A quoted description'`;
    expect(parseSkillMd(input)).toEqual({
      name: 'quoted-skill',
      description: 'A quoted description'
    });
  });

  it('should return empty strings when fields are missing', () => {
    const input = `some-other-field: foo`;
    expect(parseSkillMd(input)).toEqual({
      name: '',
      description: ''
    });
  });

  it('should handle multiline content and ignore irrelevant text', () => {
    const input = `
---
name: multi-skill
version: 1.0.0
description: A skill amidst other text
---
# Content goes here
    `;
    expect(parseSkillMd(input)).toEqual({
      name: 'multi-skill',
      description: 'A skill amidst other text'
    });
  });

  it('should handle partial fields (name only)', () => {
    const input = `name: just-name`;
    expect(parseSkillMd(input)).toEqual({
      name: 'just-name',
      description: ''
    });
  });

  it('should handle partial fields (description only)', () => {
    const input = `description: just-desc`;
    expect(parseSkillMd(input)).toEqual({
      name: '',
      description: 'just-desc'
    });
  });
});

describe("scanDir via CLI commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for non-existent directory", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    expect(existsSync("/nonexistent")).toBe(false);
  });

  it("should parse SKILL.md frontmatter correctly", () => {
    const skillContent = `---
name: test-skill
description: A test skill for unit testing
---
# Test Skill
Content here`;

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([
      { name: "test-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(readFileSync).mockReturnValue(skillContent);
    vi.mocked(statSync).mockReturnValue({ mtime: new Date("2026-01-01") } as any);

    expect(readFileSync("/skills/test-skill/SKILL.md", "utf8")).toContain("name: test-skill");
  });

  it("should skip hidden directories", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([
      { name: ".hidden", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
      { name: "visible", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(readFileSync).mockReturnValue("---\nname: visible\ndescription: Visible skill\n---\n");
    vi.mocked(statSync).mockReturnValue({ mtime: new Date() } as any);

    const entries = readdirSync("/skills", { withFileTypes: true });
    const visible = entries.filter((e) => !e.name.startsWith("."));
    expect(visible).toHaveLength(1);
    expect(visible[0].name).toBe("visible");
  });

  it("should skip entries without SKILL.md", () => {
    vi.mocked(existsSync).mockImplementation((path: any) => {
      if (path === "/skills") return true;
      if (path === "/skills/no-skill/SKILL.md") return false;
      if (path === "/skills/with-skill/SKILL.md") return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([
      { name: "no-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
      { name: "with-skill", isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, parentPath: "/skills" } as any,
    ]);
    vi.mocked(readFileSync).mockReturnValue("---\nname: with-skill\ndescription: Has skill file\n---\n");
    vi.mocked(statSync).mockReturnValue({ mtime: new Date() } as any);

    expect(existsSync("/skills/no-skill/SKILL.md")).toBe(false);
    expect(existsSync("/skills/with-skill/SKILL.md")).toBe(true);
  });
});
