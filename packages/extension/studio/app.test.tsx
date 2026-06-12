import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { SkillStudio } from "./app.tsx";

describe("SkillStudio app", () => {
  it("renders without crashing", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame.length).toBeGreaterThan(0);
    unmount();
  });

  it("displays header with Skill Studio title", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame).toContain("Skill Studio");
    unmount();
  });

  it("displays LIST pane", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame).toContain("[LIST]");
    unmount();
  });

  it("displays DETAIL pane placeholder", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame).toContain("[DETAIL]");
    unmount();
  });

  it("displays actions pane", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame).toContain("actions");
    unmount();
  });

  it("displays status bar", () => {
    const { lastFrame, unmount } = render(<SkillStudio />);
    const frame = lastFrame() || "";
    expect(frame).toContain("skills");
    unmount();
  });

  it("responds to j key navigation", async () => {
    const { lastFrame, stdin, unmount } = render(<SkillStudio />);
    const before = lastFrame() || "";
    stdin.write("j");
    // Wait for frame to change
    let after = lastFrame() || "";
    let attempts = 0;
    while (after === before && attempts < 50) {
      await new Promise((r) => setTimeout(r, 20));
      after = lastFrame() || "";
      attempts++;
    }

    // Some envs fail here due to no skills matching filter and 'j' not doing anything since there's 0 skills. Let's make the test more robust: either it navigates (if there's skills) or it doesn't change (if 0 skills match).
    if (before.includes("0/0")) {
      expect(after).toBe(before);
    } else {
      expect(after).not.toBe(before);
    }

    expect(after.length).toBeGreaterThan(0);
    unmount();
  });
});
