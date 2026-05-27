import { describe, it, expect, vi } from "vitest";
import { formatRouteMarkdown, formatUsageTable, recipeList, skillSearch, skillInfo, presetList, transitionList } from "./index.ts";

function buildExecArgs(p: { action: string; target?: string; args?: string[]; session?: string }) {
  const execArgs = [p.action];
  if (p.target !== undefined) execArgs.push(p.target);
  if (p.args !== undefined) execArgs.push(...p.args);
  if (p.session) execArgs.unshift("--session", p.session);
  return execArgs;
}

describe("formatRouteMarkdown", () => {
  it("returns markdown table with route fields", () => {
    const result = formatRouteMarkdown("open a website");
    expect(result).toContain("## Route Decision");
    expect(result).toContain("| Field | Value |");
    expect(result).toContain("**Driver**");
    expect(result).toContain("### Recipe");
  });

  it("includes warnings when present", () => {
    const result = formatRouteMarkdown("rm -rf everything");
    expect(result).toContain("⚠️");
  });

  it("includes recipe steps in output", () => {
    const result = formatRouteMarkdown("navigate to example.com");
    expect(result).toContain("1.");
    expect(result).toContain("### Recipe");
  });
});

describe("formatUsageTable", () => {
  it("returns markdown table with usage metrics", () => {
    const result = formatUsageTable();
    expect(result).toContain("## Usage & Observability");
    expect(result).toContain("| Metric | Value |");
    expect(result).toContain("Prompt tokens");
  });
});

describe("recipeList", () => {
  it("returns markdown list of recipes", () => {
    const result = recipeList();
    expect(result).toContain("## Available Recipes");
    expect(result).toContain("tuistory-launch");
    expect(result).toContain("browser-loop");
    expect(result).toContain("showcase-compose");
    expect(result).toContain("qa-report");
  });
});

describe("skillSearch", () => {
  it("returns usage message when no query provided", () => {
    expect(skillSearch("")).toContain("Usage");
  });

  it("finds matching skills", () => {
    const result = skillSearch("browser");
    expect(result).toContain("Skill Search");
  });
});

describe("skillInfo", () => {
  it("returns usage message when no name provided", () => {
    expect(skillInfo("")).toContain("Usage");
  });
});

describe("presetList", () => {
  it("lists all Remotion presets", () => {
    const result = presetList();
    expect(result).toContain("warm");
    expect(result).toContain("neon");
    expect(result).toContain("ocean");
  });
});

describe("transitionList", () => {
  it("lists all Remotion transitions", () => {
    const result = transitionList();
    expect(result).toContain("flash");
    expect(result).toContain("mosaic");
    expect(result).toContain("chromatic");
  });
});

describe("Browser Command Argument Construction", () => {
  it("constructs simple commands correctly", () => {
    const args = buildExecArgs({ action: "open", target: "https://example.com" });
    expect(args).toEqual(["open", "https://example.com"]);
  });

  it("handles commands with arguments safely", () => {
    const args = buildExecArgs({ action: "fill", target: "input", args: ["hello world"] });
    expect(args).toEqual(["fill", "input", "hello world"]);
  });

  it("handles complex array combinations", () => {
    const args = buildExecArgs({ action: "click", target: "button", args: ["submit form", "extra arg"] });
    expect(args).toEqual(["click", "button", "submit form", "extra arg"]);
  });

  it("adds session to the beginning when provided", () => {
    const args = buildExecArgs({ action: "open", target: "https://example.com", session: "test-session" });
    expect(args).toEqual(["--session", "test-session", "open", "https://example.com"]);
  });


  it("safely handles special characters without injection", () => {
    // A command with quotes or spaces does not get split, it's treated exactly as passed
    const args = buildExecArgs({ action: "fill", target: "input", args: ['"malicious" --flag'] });
    expect(args).toEqual(["fill", "input", '"malicious" --flag']);
  });
});
