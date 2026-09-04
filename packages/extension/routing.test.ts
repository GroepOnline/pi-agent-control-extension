import { describe, it, expect } from "vitest";
import { routeControlTask, renderRoute } from "./routing.ts";

describe("Routing Logic", () => {
  it("routes browser tasks to agent-browser and screenshots", () => {
    const result = routeControlTask("do a visual qa of the login page");
    expect(result.driver).toBe("agent-browser");
    expect(result.capture).toBe("screenshots");
    expect(result.skills).toContain("agent-browser");
  });

  it("routes terminal escaping tasks to true-input and mp4", () => {
    const result = routeControlTask("verify the escape sequence encoding in wezterm");
    expect(result.driver).toBe("true-input");
    expect(result.capture).toBe("mp4");
    expect(result.skills).toContain("true-input");
  });

  it("routes generic cli tasks to tuistory and cast", () => {
    const result = routeControlTask("run a snapshot on this cli app");
    expect(result.driver).toBe("tuistory");
    expect(result.capture).toBe("cast");
    expect(result.skills).toContain("tuistory");
  });

  it("handles word-boundary matching correctly to prevent false positives", () => {
    // "api" should not match "pi agent"
    const resultApi = routeControlTask("fetch from the rest api");
    expect(resultApi.skills).not.toContain("background-pty");

    // "pi agent" should match
    const resultPi = routeControlTask("use the pi agent to do this");
    expect(resultPi.skills).toContain("background-pty");

    // "random" should not match "dom manipulation"
    const resultRandom = routeControlTask("pick a random number");
    expect(resultRandom.driver).not.toBe("agent-browser");
  });

  it("adds color warnings for tuistory driver if missing force_color", () => {
    const result = routeControlTask("run a tui app");
    expect(result.warnings.some(w => w.includes("FORCE_COLOR=3"))).toBe(true);
  });

  it("removes color warnings for tuistory driver if force_color is present", () => {
    const result = routeControlTask("run a tui app with force_color=3 and colorterm=truecolor");
    expect(result.warnings.some(w => w.includes("FORCE_COLOR=3"))).toBe(false);
  });

  it("requires --repo-root warning for tctl launches", () => {
    const result = routeControlTask("use tctl to start");
    expect(result.warnings.some(w => w.includes("--repo-root"))).toBe(true);
  });

  it("routes test matrix tasks to qa-report", () => {
    const result = routeControlTask("run a test matrix on this");
    expect(result.deliverable).toBe("qa-report");
    expect(result.skills).toContain("verify");
  });

  it("routes workspace init tasks", () => {
    const result = routeControlTask("initialize workspace");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("init");
    expect(result.skills).toContain("wiki");
  });

  it("routes wiki tasks", () => {
    const result = routeControlTask("create architecture map");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("wiki");
  });

  it("routes safety review tasks", () => {
    const result = routeControlTask("audit the safety");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("review");
    expect(result.skills).toContain("session-navigation");
  });

  it("routes research and optimize tasks", () => {
    const result = routeControlTask("investigate with a subagent");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("session-navigation");
  });

  it("routes complex chain improvements", () => {
    const result = routeControlTask("analyze and improve the project");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("init");
    expect(result.skills).toContain("wiki");
    expect(result.skills).toContain("review");
  });

  it("adds warnings for tctl without repo-root", () => {
    const result = routeControlTask("run tctl");
    expect(result.warnings.some(w => w.includes("--repo-root"))).toBe(true);
  });

  it("does not add tuistory warning if proper colors set", () => {
    const result = routeControlTask("run tuistory with force_color colorterm truecolor");
    expect(result.warnings.some(w => w.includes("FORCE_COLOR=3"))).toBe(false);
  });

  it("supports deliverable hint in routeControlTask", () => {
    const result = routeControlTask("run something", "with a video");
    expect(result.deliverable).toBe("showcase-video");
  });

  it("buildRecipe handles agent-browser driver", () => {
    const result = routeControlTask("test browser", "screenshot");
    expect(result.recipe.some(step => step.includes("agent-browser open/snapshot"))).toBe(true);
  });

  it("buildRecipe handles true-input driver", () => {
    const result = routeControlTask("test real terminal", "mp4");
    expect(result.recipe.some(step => step.includes("Use true-input"))).toBe(true);
  });

  it("buildRecipe handles mixed driver", () => {
    const result = routeControlTask("setup workspace");
    expect(result.recipe.some(step => step.includes("Use subagents and chained orchestration"))).toBe(true);
  });

  it("buildRecipe handles qa-report deliverable", () => {
    const result = routeControlTask("qa checklist");
    expect(result.recipe.some(step => step.includes("Write a QA table"))).toBe(true);
  });

  it("buildRecipe handles non-report capture", () => {
    const result = routeControlTask("run a snapshot on this cli app", "cast");
    expect(result.recipe.some(step => step.includes("Expected capture artifact type: cast"))).toBe(true);
  });

  it("renderRoute returns formatted string", () => {
    // "browser" triggers agent-browser driver and screenshots
    const decision = routeControlTask("test browser");
    const rendered = renderRoute(decision);
    expect(rendered).toContain("Driver: agent-browser");
    expect(rendered).toContain("Deliverable: browser-proof");
    expect(rendered).toContain("Capture: screenshots");
    expect(rendered).toContain("Skills:");
    expect(rendered).toContain("Warnings:");
    expect(rendered).toContain("Recipe:");
  });

  it("renderRoute handles warnings", () => {
    // "tctl" also triggers tuistory which complains about missing colors
    const decision = routeControlTask("run tctl with force_color colorterm");
    const rendered = renderRoute(decision);
    expect(rendered).toContain("Warnings:\n- tctl launches require --repo-root");
  });

  it("routes meta-skill and chain workflows to mixed driver", () => {
    const result = routeControlTask("set up a meta-skill pipeline");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("meta-control");
    expect(result.skills).toContain("background-pty");
  });

  it("routes computer use requests with warning", () => {
    const result = routeControlTask("automate this desktop app via os control");
    expect(result.driver).toBe("agent-browser");
    expect(result.warnings.some(w => w.includes("experimental"))).toBe(true);
  });

  it("routes background pty tasks", () => {
    const result = routeControlTask("start a long running background-pty session");
    expect(result.skills).toContain("background-pty");
  });

  it("routes chain orchestrat tasks to mixed driver", () => {
    const result = routeControlTask("workflow orchestrat for the pipeline");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("meta-control");
  });
});
