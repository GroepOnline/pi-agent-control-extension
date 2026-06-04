import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { SkillList } from "./SkillList.tsx";
import type { SkillEntry } from "../model/skill.ts";

function makeSkill(name: string, overrides: Partial<SkillEntry> = {}): SkillEntry {
  return {
    name,
    description: "Test skill",
    path: "/test/" + name,
    source: "pi",
    sourceDir: "pi",
    enabled: true,
    valid: "ok",
    mtime: new Date(),
    shadowState: null,
    ...overrides,
  };
}

describe("SkillList", () => {
  it("renders empty list message when no skills", () => {
    const { lastFrame } = render(
      <SkillList
        skills={[]}
        selectedIndex={0}
        focus="list"
        totalCount={0}
        scrollOffset={0}
      />
    );
    expect(lastFrame()).toContain("No skills match filter");
  });

  it("renders skill names with source indicators", () => {
    const skills = [makeSkill("agent-browser"), makeSkill("agent-git", { source: "user", sourceDir: "devin" })];
    const { lastFrame } = render(
      <SkillList
        skills={skills}
        selectedIndex={0}
        focus="list"
        totalCount={2}
        scrollOffset={0}
      />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("agent-browser");
    expect(frame).toContain("agent-git");
    expect(frame).toContain("P");
    expect(frame).toContain("U");
  });

  it("shows scroll indicator when there are more items below", () => {
    const skills = [makeSkill("a"), makeSkill("b")];
    const { lastFrame } = render(
      <SkillList
        skills={skills}
        selectedIndex={0}
        focus="list"
        totalCount={5}
        scrollOffset={0}
      />
    );
    expect(lastFrame()).toContain("↓3 more");
  });

  it("shows scroll indicator when there are items above", () => {
    const skills = [makeSkill("a"), makeSkill("b")];
    const { lastFrame } = render(
      <SkillList
        skills={skills}
        selectedIndex={0}
        focus="list"
        totalCount={5}
        scrollOffset={3}
      />
    );
    expect(lastFrame()).toContain("↑3 more");
  });

  it("highlights filtered query in skill names", () => {
    const skills = [makeSkill("agent-browser"), makeSkill("agent-git")];
    const { lastFrame } = render(
      <SkillList
        skills={skills}
        selectedIndex={0}
        focus="list"
        totalCount={2}
        scrollOffset={0}
        filterQuery="browser"
      />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("agent-browser");
  });
});
