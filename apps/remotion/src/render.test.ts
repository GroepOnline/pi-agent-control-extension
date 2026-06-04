import { describe, it, expect } from "vitest";
import { buildShowcasePropsFromRecipe } from "./lib/recipe-props.js";

describe("buildShowcasePropsFromRecipe", () => {
  it("builds browser-loop props", () => {
    const props = buildShowcasePropsFromRecipe("browser-loop");
    expect(props.preset).toBe("macos");
    expect(props.layout).toBe("single");
    expect(props.transitionStyle).toBe("motion-blur");
  });

  it("builds tuistory-launch props", () => {
    const props = buildShowcasePropsFromRecipe("tuistory-launch");
    expect(props.preset).toBe("dark-pro");
    expect(props.transitionStyle).toBe("scan-line");
    expect(props.effects).toHaveLength(1);
    expect(props.effects![0].type).toBe("fade-in");
  });

  it("builds showcase-compose props", () => {
    const props = buildShowcasePropsFromRecipe("showcase-compose");
    expect(props.preset).toBe("neon");
    expect(props.layout).toBe("side-by-side");
    expect(props.transitionStyle).toBe("flash");
  });

  it("builds qa-report props", () => {
    const props = buildShowcasePropsFromRecipe("qa-report");
    expect(props.preset).toBe("presentation");
    expect(props.showProgress).toBe(true);
  });

  it("binds capture path to clips", () => {
    const props = buildShowcasePropsFromRecipe("browser-loop", "/tmp/capture.mp4");
    expect(props.clips).toEqual(["/tmp/capture.mp4"]);
    expect(props.subtitle).toContain("/tmp/capture.mp4");
  });

  it("defaults to warm preset for unknown recipes", () => {
    const props = buildShowcasePropsFromRecipe("custom-recipe");
    expect(props.preset).toBe("warm");
    expect(props.transitionStyle).toBe("motion-blur");
  });
});
