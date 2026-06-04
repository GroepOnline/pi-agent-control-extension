import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { StatusBar } from "./StatusBar.tsx";

describe("StatusBar", () => {
  it("renders studio name and skill count", () => {
    const { lastFrame } = render(
      <StatusBar totalSkills={42} filteredCount={10} query="" />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("Skill Studio");
    expect(frame).toContain("10/42");
  });

  it("shows filter indicator when query is set", () => {
    const { lastFrame } = render(
      <StatusBar totalSkills={42} filteredCount={3} query="browser" />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain('filter: "browser"');
    expect(frame).toContain("3/42");
  });

  it("shows selected skill info when provided", () => {
    const { lastFrame } = render(
      <StatusBar
        totalSkills={42}
        filteredCount={10}
        query=""
        selectedName="agent-browser"
        selectedSource="pi"
        selectedValid="ok"
      />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("agent-browser");
    expect(frame).toContain("[PI]");
  });

  it("shows filter mode indicator with yellow border", () => {
    const { lastFrame } = render(
      <StatusBar
        totalSkills={42}
        filteredCount={5}
        query=""
        filterMode={true}
        filterQuery="test"
      />
    );
    const frame = lastFrame() || "";
    expect(frame).toContain("FILTER");
    expect(frame).toContain("test");
  });
});
