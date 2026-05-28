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

function TestFilter({ skills, initialQuery }: { skills: SkillEntry[]; initialQuery?: string }) {
  const { query, setQuery, filtered } = useFilter(skills);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && initialQuery) {
    setQuery(initialQuery);
    setInitialized(true);
  }

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
    const skills = [makeSkill("agent-browser", "Browser skill"), makeSkill("agent-git", "Git skill")];
    const { lastFrame } = render(<TestFilter skills={skills} initialQuery="browser" />);
    const frame = lastFrame() || "";
    expect(frame).toContain("count=1");
    expect(frame).toContain("agent-browser");
    expect(frame).not.toContain("agent-git");
  });
});
