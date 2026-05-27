import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { Text } from "ink";
import { useSkillRegistry } from "./useSkillRegistry.ts";

function TestRegistry() {
  const { skills, userSkills, piSkills, toggle, reload } = useSkillRegistry();
  return (
    <Text>skills={skills.length} userSkills={userSkills.length} piSkills={piSkills.length} toggle={typeof toggle} reload={typeof reload}</Text>
  );
}

describe("useSkillRegistry", () => {
  it("returns expected shape", () => {
    const { lastFrame } = render(<TestRegistry />);
    const frame = lastFrame() || "";
    expect(frame).toContain("skills=");
    expect(frame).toContain("userSkills=");
    expect(frame).toContain("piSkills=");
    expect(frame).toContain("toggle=function");
    expect(frame).toContain("reload=function");
  });
});
