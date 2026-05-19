import { describe, it, expect } from "vitest";
import { routeControlTask } from "./routing.ts";

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
    expect(resultApi.skills).not.toContain("pi-agent-cli");

    // "pi agent" should match
    const resultPi = routeControlTask("use the pi agent to do this");
    expect(resultPi.skills).toContain("pi-agent-cli");

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

  it("routes chaining requests to mixed driver", () => {
    const result = routeControlTask("analyze and improve the whole codebase");
    expect(result.driver).toBe("mixed");
    expect(result.skills).toContain("init");
    expect(result.skills).toContain("wiki");
    expect(result.skills).toContain("review");
    expect(result.skills).toContain("autoresearch");
  });
});
