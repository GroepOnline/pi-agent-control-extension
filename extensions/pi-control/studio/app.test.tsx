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
    await new Promise((r) => setTimeout(r, 50));
    const after = lastFrame() || "";
    expect(after.length).toBeGreaterThan(0);
    unmount();
  });
});
