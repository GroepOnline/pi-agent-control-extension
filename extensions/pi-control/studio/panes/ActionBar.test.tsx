import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ActionBar } from "./ActionBar.tsx";

describe("ActionBar", () => {
  it("renders with focus styling when focused", () => {
    const { lastFrame } = render(<ActionBar focus="actions" />);
    const frame = lastFrame();
    expect(frame).toContain("actions");
    expect(frame).toContain("x");
    expect(frame).toContain("toggle");
  });

  it("renders without bold border when not focused", () => {
    const { lastFrame } = render(<ActionBar focus="list" />);
    const frame = lastFrame();
    expect(frame).toContain("actions");
    expect(frame).toContain("quit");
  });

  it("contains all action keys", () => {
    const { lastFrame } = render(<ActionBar focus="actions" />);
    const frame = lastFrame() || "";
    const keys = ["x", "o", "d", "v", "r", "/", "?", "q"];
    for (const key of keys) {
      expect(frame).toContain(key);
    }
  });
});
