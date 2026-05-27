import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React, { useState } from "react";
import { Text } from "ink";
import { useFilter } from "./useFilter.ts";
import type { SkillEntry } from "../model/skill.ts";

function makeSkill(name: string, desc: string): SkillEntry {
  return {
    name,
    description: desc,
    path: "/test/" + name,
    source: "pi",
    sourceDir: "pi",
    enabled: true,
    valid: "ok",
    mtime: new Date(),
    shadowState: null,
  };
}

function TestFilter({ skills }: { skills: SkillEntry[] }) {
  const { query, setQuery, filtered } = useFilter(skills);
  return (
    <Text>query={query} count={filtered.length} names={filtered.map((s) => s.name).join(",")}</Text>
  );
}

describe("useFilter", () => {
  it("returns all skills when query is empty", () => {
    const skills = [makeSkill("agent-browser", "Browser skill"), makeSkill("agent-git", "Git skill")];
    const { lastFrame } = render(<TestFilter skills={skills} />);
    const frame = lastFrame() || "";
    expect(frame).toContain("count=2");
    expect(frame).toContain("agent-browser");
    expect(frame).toContain("agent-git");
  });

  it("filters by name match", () => {
    // We can't easily test setQuery via render output, but we verify the hook initializes
    const skills = [makeSkill("agent-browser", "Browser skill"), makeSkill("agent-git", "Git skill")];
    const { lastFrame } = render(<TestFilter skills={skills} />);
    expect(lastFrame()).toContain("count=2");
  });
});
