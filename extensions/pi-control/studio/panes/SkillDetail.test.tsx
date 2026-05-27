import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { SkillDetail } from "./SkillDetail.tsx";
import type { SkillEntry } from "../model/skill.ts";

function makeSkill(overrides: Partial<SkillEntry> = {}): SkillEntry {
  return {
    name: "agent-browser",
    description: "Browser automation skill",
    path: "/test/agent-browser/SKILL.md",
    source: "pi",
    sourceDir: "pi",
    enabled: true,
    valid: "ok",
    mtime: new Date("2024-06-15T10:00:00Z"),
    shadowState: null,
    ...overrides,
  };
}

describe("SkillDetail", () => {
  it("shows placeholder when no skill is selected", () => {
    const { lastFrame } = render(<SkillDetail skill={null} focus="detail" />);
    expect(lastFrame()).toContain("Select a skill to view details");
  });

  it("renders skill details when a skill is provided", () => {
    const { lastFrame } = render(<SkillDetail skill={makeSkill()} focus="detail" />);
    const frame = lastFrame() || "";
    expect(frame).toContain("agent-browser");
    expect(frame).toContain("Browser automation skill");
    expect(frame).toContain("PI extension");
    expect(frame).toContain("enabled");
  });

  it("shows disabled state correctly", () => {
    const { lastFrame } = render(
      <SkillDetail skill={makeSkill({ enabled: false })} focus="detail" />
    );
    expect(lastFrame()).toContain("disabled");
  });

  it("shows shadowed state when applicable", () => {
    const { lastFrame } = render(
      <SkillDetail
        skill={makeSkill({ shadowState: "shadowed" })}
        focus="detail"
      />
    );
    expect(lastFrame()).toContain("shadowed");
  });

  it("shows overrides state when applicable", () => {
    const { lastFrame } = render(
      <SkillDetail
        skill={makeSkill({ shadowState: "overrides" })}
        focus="detail"
      />
    );
    expect(lastFrame()).toContain("overrides");
  });

  it("truncates long descriptions", () => {
    const { lastFrame } = render(
      <SkillDetail
        skill={makeSkill({
          description: "a".repeat(50),
        })}
        focus="detail"
      />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("…");
  });
});
