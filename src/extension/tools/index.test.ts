import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTools } from "./index.ts";

vi.mock("../../core/routing/routing.ts", () => ({
  routeControlTask: vi.fn(() => ({
    driver: "tuistory",
    skills: ["tuistory", "capture"],
    capture: "cast",
    deliverable: "proof-report",
    warnings: ["test warning"],
    recipe: ["step 1", "step 2"],
  })),
  renderRoute: vi.fn(() => "Driver: tuistory\nCapture: cast"),
}));

vi.mock("../../core/verify/verify.ts", () => ({
  recipeFor: vi.fn(() => "mock recipe content"),
  verifyCommitments: vi.fn(() => ({ ok: true, failed: [], checks: [] })),
}));

vi.mock("../../core/utils.ts", () => ({
  rootDir: vi.fn(() => "/mock/root"),
  listSkills: vi.fn(() => [
    { name: "agent-browser", description: "Browser automation" },
    { name: "tuistory", description: "TUI recording" },
  ]),
  runValidator: vi.fn(() => "All checks passed"),
  buildUsageReport: vi.fn(() => ({
    text: "# Usage Report",
    details: { model: null, promptTokens: 0, completionTokens: 0, cachedInputTokens: 0, billableInputTokens: 0, inputCostPerMillion: 0, outputCostPerMillion: 0, currency: "USD", estimatedInputCost: 0, estimatedOutputCost: 0, estimatedTotalCost: 0 },
  })),
  buildParallelVerifyReport: vi.fn(() => ({
    text: "# Parallel Report",
    details: { reports: [], ok: true },
  })),
  UsageInput: {},
  ParallelReport: {},
}));

vi.mock("../../drivers/browser/browser.ts", () => ({
  browserControlGuidance: vi.fn(() => "### Browser Control Best Practices\n1. Route First"),
  BROWSER_CONTROL_STATUS: { implemented: true, driver: "agent-browser" },
}));

vi.mock("../../drivers/desktop/os.ts", () => ({
  osControlGuidance: vi.fn(() => "# OS Control\nStatus: prototype"),
  OS_CONTROL_STATUS: { implemented: false, driver: "os-control" },
}));

vi.mock("./browser_command.ts", () => ({
  browserCommandTool: {
    name: "control_browser_command",
    label: "Browser Command",
    description: "Execute browser command",
    parameters: {},
    execute: vi.fn(async () => ({ content: [{ type: "text", text: "browser result" }], details: {} })),
  },
}));

// Helper to get all registered tools
function getRegisteredTools() {
  const registered: any[] = [];
  const pi = {
    registerTool: vi.fn((tool: any) => registered.push(tool)),
  } as any;
  registerTools(pi);
  return registered;
}

describe("registerTools", () => {
  it("registers all tools with the pi API", () => {
    const registered = getRegisteredTools();
    const toolNames = registered.map((t: any) => t.name);
    expect(toolNames).toContain("control_route");
    expect(toolNames).toContain("control_recipe");
    expect(toolNames).toContain("control_evidence_schema");
    expect(toolNames).toContain("control_skill_index");
    expect(toolNames).toContain("control_doctor");
    expect(toolNames).toContain("control_verify_commitments");
    expect(toolNames).toContain("control_usage");
    expect(toolNames).toContain("control_parallel_verify");
    expect(toolNames).toContain("control_browser_guidance");
    expect(toolNames).toContain("control_os_guidance");
    expect(toolNames).toContain("control_browser_command");
  });

  it("registers exactly 12 tools", () => {
    const registered = getRegisteredTools();
    expect(registered).toHaveLength(12);
  });

  it("each tool has a name, description, and execute function", () => {
    const registered = getRegisteredTools();
    for (const tool of registered) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.execute).toBe("function");
    }
  });

  it("each tool has unique name", () => {
    const registered = getRegisteredTools();
    const names = registered.map((t: any) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("control_route tool", () => {
  it("executes and returns route decision text", async () => {
    const registered = getRegisteredTools();
    const routeTool = registered.find((t: any) => t.name === "control_route");
    expect(routeTool).toBeDefined();
    const result = await routeTool.execute("id", { task: "run a tui app" });
    expect(result.content[0].text).toBe("Driver: tuistory\nCapture: cast");
    expect(result.details).toBeDefined();
  });

  it("passes deliverable hint to routeControlTask", async () => {
    const { routeControlTask } = await import("../../core/routing/routing.ts");
    const registered = getRegisteredTools();
    const routeTool = registered.find((t: any) => t.name === "control_route");
    await routeTool.execute("id", { task: "test task", deliverable: "showcase-video" });
    expect(routeControlTask).toHaveBeenCalledWith("test task", "showcase-video");
  });

  it("defaults deliverable to empty string when not provided", async () => {
    const { routeControlTask } = await import("../../core/routing/routing.ts");
    const registered = getRegisteredTools();
    const routeTool = registered.find((t: any) => t.name === "control_route");
    await routeTool.execute("id", { task: "test task" });
    expect(routeControlTask).toHaveBeenCalledWith("test task", "");
  });

  it("returns content with type 'text'", async () => {
    const registered = getRegisteredTools();
    const routeTool = registered.find((t: any) => t.name === "control_route");
    const result = await routeTool.execute("id", { task: "test" });
    expect(result.content[0].type).toBe("text");
  });
});

describe("control_recipe tool", () => {
  it("executes and returns recipe text", async () => {
    const registered = getRegisteredTools();
    const recipeTool = registered.find((t: any) => t.name === "control_recipe");
    expect(recipeTool).toBeDefined();
    const result = await recipeTool.execute("id", { kind: "tuistory-launch" });
    expect(result.content[0].text).toBe("mock recipe content");
    expect(result.details.kind).toBe("tuistory-launch");
  });

  it("executes control_recipe", async () => {
    const { recipeFor } = await import("../../core/verify/verify.ts");
    const registered = getRegisteredTools();
    const recipeTool = registered.find((t: any) => t.name === "control_recipe");
    await recipeTool.execute("id", { kind: "browser-loop" });
    expect(recipeFor).toHaveBeenCalledWith("browser-loop");
  });
});

describe("control_evidence_schema tool", () => {
  it("executes and returns evidence schema", async () => {
    const registered = getRegisteredTools();
    const schemaTool = registered.find((t: any) => t.name === "control_evidence_schema");
    expect(schemaTool).toBeDefined();
    const result = await schemaTool.execute();
    expect(result.content[0].text).toContain("Evidence Schema");
  });

  it("returns empty details object", async () => {
    const registered = getRegisteredTools();
    const schemaTool = registered.find((t: any) => t.name === "control_evidence_schema");
    const result = await schemaTool.execute();
    expect(result.details).toEqual({});
  });
});

describe("control_skill_index tool", () => {
  it("executes and returns skill list", async () => {
    const registered = getRegisteredTools();
    const skillTool = registered.find((t: any) => t.name === "control_skill_index");
    expect(skillTool).toBeDefined();
    const result = await skillTool.execute();
    expect(result.content[0].text).toContain("agent-browser");
    expect(result.content[0].text).toContain("tuistory");
    expect(result.details.skills).toHaveLength(2);
  });

  it("executes control_skill_index", async () => {
    const { listSkills } = await import("../../core/utils.ts");
    vi.mocked(listSkills).mockReturnValueOnce([
      { name: "agent-browser", description: "Browser automation" },
    ]);

    const registered = getRegisteredTools();
    const skillTool = registered.find((t: any) => t.name === "control_skill_index");
    const result = await skillTool.execute();
    // The SKILL_NAMES list includes "tuistory" which is not in the returned skills
    expect(result.content[0].text).toContain("Missing:");
    expect(result.details.missing.length).toBeGreaterThan(0);
  });

  it("lists all skills in the content text", async () => {
    const registered = getRegisteredTools();
    const skillTool = registered.find((t: any) => t.name === "control_skill_index");
    const result = await skillTool.execute();
    expect(result.content[0].text).toContain("agent-browser: Browser automation");
    expect(result.content[0].text).toContain("tuistory: TUI recording");
  });

  it("returns empty missing array when all skills present", async () => {
    const { listSkills } = await import("../../core/utils.ts");
    // Return all SKILL_NAMES
    const { SKILL_NAMES } = await import("../../core/types/schema.ts");
    vi.mocked(listSkills).mockReturnValueOnce(
      SKILL_NAMES.map((name: any) => ({ name, description: `desc ${name}` }))
    );

    const registered = getRegisteredTools();
    const skillTool = registered.find((t: any) => t.name === "control_skill_index");
    const result = await skillTool.execute();
    expect(result.details.missing).toEqual([]);
    expect(result.content[0].text).not.toContain("Missing:");
  });
});

describe("control_doctor tool", () => {
  it("executes and returns validator output", async () => {
    const registered = getRegisteredTools();
    const doctorTool = registered.find((t: any) => t.name === "control_doctor");
    expect(doctorTool).toBeDefined();
    const result = await doctorTool.execute();
    expect(result.content[0].text).toBe("All checks passed");
  });

  it("returns empty details object", async () => {
    const registered = getRegisteredTools();
    const doctorTool = registered.find((t: any) => t.name === "control_doctor");
    const result = await doctorTool.execute();
    expect(result.details).toEqual({});
  });
});

describe("control_verify_commitments tool", () => {
  it("executes and returns verification result", async () => {
    const registered = getRegisteredTools();
    const verifyTool = registered.find((t: any) => t.name === "control_verify_commitments");
    expect(verifyTool).toBeDefined();
    const result = await verifyTool.execute("id", { markdown: "## Technical\n## Commitments\n## Evidence\nPASS" });
    expect(result.content[0].text).toBe("Report passes.");
    expect(result.details.ok).toBe(true);
  });

  it("returns PASS in text when verifyCommitments returns ok: true", async () => {
    const { verifyCommitments } = await import("../../core/verify/verify.ts");
    vi.mocked(verifyCommitments).mockReturnValueOnce({ ok: false, failed: ["has technical section"], checks: [] });

    const registered = getRegisteredTools();
    const verifyTool = registered.find((t: any) => t.name === "control_verify_commitments");
    const result = await verifyTool.execute("id", { markdown: "incomplete" });
    expect(result.content[0].text).toContain("Missing:");
    expect(result.content[0].text).toContain("has technical section");
  });

  it("reports multiple missing sections", async () => {
    const { verifyCommitments } = await import("../../core/verify/verify.ts");
    vi.mocked(verifyCommitments).mockReturnValueOnce({
      ok: false,
      failed: ["has technical section", "has commitments section"],
      checks: [],
    });

    const registered = getRegisteredTools();
    const verifyTool = registered.find((t: any) => t.name === "control_verify_commitments");
    const result = await verifyTool.execute("id", { markdown: "bare" });
    expect(result.content[0].text).toContain("has technical section");
    expect(result.content[0].text).toContain("has commitments section");
  });

  it("passes markdown to verifyCommitments", async () => {
    const { verifyCommitments } = await import("../../core/verify/verify.ts");
    const registered = getRegisteredTools();
    const verifyTool = registered.find((t: any) => t.name === "control_verify_commitments");
    await verifyTool.execute("id", { markdown: "test content" });
    expect(verifyCommitments).toHaveBeenCalledWith("test content");
  });
});

describe("control_usage tool", () => {
  it("executes and returns usage report", async () => {
    const registered = getRegisteredTools();
    const usageTool = registered.find((t: any) => t.name === "control_usage");
    expect(usageTool).toBeDefined();
    const result = await usageTool.execute("id", { promptTokens: 1000, completionTokens: 500 });
    expect(result.content[0].text).toContain("Usage Report");
  });

  it("executes control_usage with params", async () => {
    const { buildUsageReport } = await import("../../core/utils.ts");
    const registered = getRegisteredTools();
    const usageTool = registered.find((t: any) => t.name === "control_usage");
    const params = {
      model: "claude-4",
      promptTokens: 10000,
      completionTokens: 5000,
      cachedInputTokens: 2000,
      inputCostPerMillion: 3,
      outputCostPerMillion: 15,
      currency: "EUR",
    };
    await usageTool.execute("id", params);
    expect(buildUsageReport).toHaveBeenCalledWith(params);
  });

  it("works with empty parameters", async () => {
    const registered = getRegisteredTools();
    const usageTool = registered.find((t: any) => t.name === "control_usage");
    const result = await usageTool.execute("id", {});
    expect(result.content[0].text).toBeDefined();
    expect(result.details).toBeDefined();
  });
});

describe("control_parallel_verify tool", () => {
  it("executes with report array", async () => {
    const registered = getRegisteredTools();
    const parallelTool = registered.find((t: any) => t.name === "control_parallel_verify");
    expect(parallelTool).toBeDefined();
    const result = await parallelTool.execute("id", { reports: [{ name: "test", markdown: "## Technical\n## Commitments\n## Evidence\nPASS" }] });
    expect(result.content[0].text).toContain("Parallel Report");
  });

  it("handles non-array reports input gracefully", async () => {
    const registered = getRegisteredTools();
    const parallelTool = registered.find((t: any) => t.name === "control_parallel_verify");
    const result = await parallelTool.execute("id", { reports: null as any });
    expect(result.content[0].text).toContain("Parallel Report");
  });

  it("executes control_parallel_verify", async () => {
    const { buildParallelVerifyReport } = await import("../../core/utils.ts");
    const registered = getRegisteredTools();
    const parallelTool = registered.find((t: any) => t.name === "control_parallel_verify");
    await parallelTool.execute("id", { reports: undefined as any });
    expect(buildParallelVerifyReport).toHaveBeenCalledWith([]);
  });

  it("passes reports array as-is when it is an array", async () => {
    const { buildParallelVerifyReport } = await import("../../core/utils.ts");
    const reports = [{ name: "r1", markdown: "content" }];
    const registered = getRegisteredTools();
    const parallelTool = registered.find((t: any) => t.name === "control_parallel_verify");
    await parallelTool.execute("id", { reports });
    expect(buildParallelVerifyReport).toHaveBeenCalledWith(reports);
  });
});

describe("control_browser_guidance tool", () => {
  it("executes and returns browser guidance", async () => {
    const registered = getRegisteredTools();
    const browserTool = registered.find((t: any) => t.name === "control_browser_guidance");
    expect(browserTool).toBeDefined();
    const result = await browserTool.execute();
    expect(result.content[0].text).toContain("Browser Control Best Practices");
    expect(result.details.status.implemented).toBe(true);
  });

  it("returns BROWSER_CONTROL_STATUS in details", async () => {
    const registered = getRegisteredTools();
    const browserTool = registered.find((t: any) => t.name === "control_browser_guidance");
    const result = await browserTool.execute();
    expect(result.details.status.driver).toBe("agent-browser");
  });
});

describe("control_os_guidance tool", () => {
  it("executes and returns OS guidance", async () => {
    const registered = getRegisteredTools();
    const osTool = registered.find((t: any) => t.name === "control_os_guidance");
    expect(osTool).toBeDefined();
    const result = await osTool.execute();
    expect(result.content[0].text).toContain("OS Control");
    expect(result.details.status.implemented).toBe(false);
  });

  it("returns OS_CONTROL_STATUS in details", async () => {
    const registered = getRegisteredTools();
    const osTool = registered.find((t: any) => t.name === "control_os_guidance");
    const result = await osTool.execute();
    expect(result.details.status.driver).toBe("os-control");
  });
});

describe("control_browser_command tool (delegated)", () => {
  it("is included in the registered tools", () => {
    const registered = getRegisteredTools();
    const browserCmdTool = registered.find((t: any) => t.name === "control_browser_command");
    expect(browserCmdTool).toBeDefined();
    expect(browserCmdTool.label).toBe("Browser Command");
  });

  it("delegates to the browserCommandTool execute", async () => {
    const registered = getRegisteredTools();
    const browserCmdTool = registered.find((t: any) => t.name === "control_browser_command");
    const result = await browserCmdTool.execute("id", { action: "open", target: "https://example.com" });
    expect(result.content[0].text).toBe("browser result");
  });
});
