import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { capture, executeCapturePlan, parseCaptureArgs, routeToDriver, formatCaptureMarkdown, registerCapture } from "./capture.ts";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: vi.fn((cmd: string) => {
      if (cmd === "which") throw new Error("not found");
      return "";
    }),
  };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    mkdirSync: vi.fn(actual.mkdirSync),
  };
});

vi.mock("./utils.ts", () => ({
  rootDir: vi.fn(() => "/mock/root"),
  shellEscape: vi.fn((s: string) => `'${s}'`),
}));

describe("parseCaptureArgs", () => {
  it("parses a simple target", () => {
    const r = parseCaptureArgs("https://example.com");
    expect(r.target).toBe("https://example.com");
    expect(r.format).toBe("mp4");
    expect(r.error).toBeUndefined();
  });

  it("parses target with --format flag", () => {
    const r = parseCaptureArgs("npm run dev --format cast");
    expect(r.target).toBe("npm run dev");
    expect(r.format).toBe("cast");
  });

  it("defaults to mp4 when format is omitted", () => {
    const r = parseCaptureArgs("tui-story login");
    expect(r.target).toBe("tui-story login");
    expect(r.format).toBe("mp4");
  });

  it("returns error for empty args", () => {
    const r = parseCaptureArgs("  ");
    expect(r.error).toBe("No target provided");
  });

  it("ignores invalid format and defaults to mp4", () => {
    const r = parseCaptureArgs("cmd --format invalid");
    expect(r.target).toBe("cmd");
    expect(r.format).toBe("mp4");
  });
});

describe("routeToDriver", () => {
  it("routes URLs to agent-browser", () => {
    const r = routeToDriver("https://example.com");
    expect(r.driver).toBe("agent-browser");
  });

  it("routes terminal tasks to tuistory", () => {
    const r = routeToDriver("run cli tool");
    expect(r.driver).toBe("tuistory");
  });

  it("routes real-terminal tasks to true-input", () => {
    const r = routeToDriver("ghostty key encoding test");
    expect(r.driver).toBe("true-input");
  });
});

describe("capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a capture result for browser target", () => {
    const result = capture("https://example.com", "png");
    expect(result.evidenceId).toMatch(/^capture-\d+-[a-f0-9]{8}$/);
    expect(result.driver).toBe("agent-browser");
    expect(result.format).toBe("png");
    expect(result.path.replace(/\\/g, "/")).toContain("artifacts/runs/");
    expect(result.command).toContain("agent-browser");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("returns a structurally valid capture plan for tuistory without claiming runtime proof", () => {
    const result = capture("run tui app", "cast");
    expect(result.driver).toBe("tuistory");
    expect(result.format).toBe("cast");
    expect(result.command).toContain("tctl");
    expect(result.structurallyValid).toBe(true);
    expect(result.validated).toBe(false);
    expect(result.executed).toBe(false);
  });

  it("returns a structurally valid capture plan for true-input without claiming runtime proof", () => {
    const result = capture("real terminal test", "mp4");
    expect(result.driver).toBe("true-input");
    expect(result.format).toBe("mp4");
    expect(result.structurallyValid).toBe(true);
    expect(result.validated).toBe(false);
    expect(result.executed).toBe(false);
  });

  it("keeps structural validation separate from runtime evidence validation", () => {
    const result = capture("https://example.com", "report");
    expect(result.structurallyValid).toBe(true);
    expect(result.validated).toBe(false);
  });

  it("includes warnings from routing and driver", () => {
    const result = capture("tctl launch some-task", "mp4");
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });
});

describe("executeCapturePlan", () => {
  it("executes argv steps and validates the artifact that was actually produced", async () => {
    const dir = mkdtempSync(join(tmpdir(), "capture-exec-"));
    const artifact = join(dir, "result.txt");
    const result = await executeCapturePlan({
      evidenceId: "capture-exec-ok",
      format: "report",
      path: dir,
      validated: false,
      structurallyValid: true,
      driver: "test",
      command: "node writes artifact",
      commandParts: [[process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(artifact)}, 'proof')`]],
      expectedArtifacts: [artifact],
      warnings: [],
    });
    expect(result.executed).toBe(true);
    expect(result.success).toBe(true);
    expect(result.validated).toBe(true);
    expect(result.artifacts?.[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails truthfully when the command cannot run", async () => {
    const dir = mkdtempSync(join(tmpdir(), "capture-exec-"));
    const result = await executeCapturePlan({
      evidenceId: "capture-exec-fail",
      format: "report",
      path: dir,
      validated: false,
      structurallyValid: true,
      driver: "test",
      command: "missing binary",
      commandParts: [["definitely-not-a-real-control-binary-xyz"]],
      expectedArtifacts: [join(dir, "result.txt")],
      warnings: [],
    });
    expect(result.executed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.validated).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("formatCaptureMarkdown", () => {
  it("formats a capture result as markdown", () => {
    const result = capture("https://example.com", "png");
    const md = formatCaptureMarkdown(result);
    expect(md).toContain("## Capture Result");
    expect(md).toContain("Evidence ID");
    expect(md).toContain("Driver");
    expect(md).toContain("Format");
    expect(md).toContain("Path");
    expect(md).toContain("Evidence validated");
  });

  it("includes warnings when present", () => {
    const md = formatCaptureMarkdown({
      evidenceId: "test",
      format: "mp4",
      path: "/tmp",
      validated: true,
      driver: "browser",
      command: "cmd",
      warnings: ["warn1", "warn2"],
    });
    expect(md).toContain("warn1");
    expect(md).toContain("warn2");
  });
});

describe("command security", () => {
  it("escapes malicious targets in command string without shell interpolation", () => {
    const malicious = '"; rm -rf / #';
    const result = capture(malicious, "cast");
    expect(result.command).toContain(`'${malicious}'`);
  });

  it("escapes shell metacharacters literally in command string", () => {
    const payloads = [
      '$(whoami)',
      '`id`',
      '; echo pwned',
      '| cat /etc/passwd',
      '&& malicious',
    ];
    for (const payload of payloads) {
      const result = capture(payload, "cast");
      expect(result.command).toContain(`'${payload}'`);
    }
  });

  it("uses -- flag terminator to prevent CLI flag injection in tuistory", () => {
    const flagInjection = "--backend evil";
    const result = capture(flagInjection, "cast");
    expect(result.commandParts?.some((parts) => parts.at(-1) === flagInjection && parts.at(-2) === "--")).toBe(true);
  });

  it("uses -- flag terminator to prevent CLI flag injection in browser", () => {
    const flagInjection = "--viewport 9999x9999";
    const target = "https://example.com " + flagInjection;
    const result = capture(target, "png");
    expect(result.commandParts?.some((parts) => parts.at(-1) === target && parts.at(-2) === "--")).toBe(true);
  });

  it("uses -- flag terminator to prevent CLI flag injection in true-input", () => {
    const flagInjection = "--record /tmp/evil";
    const target = "ghostty key encoding " + flagInjection;
    const result = capture(target, "mp4");
    expect(result.driver).toBe("true-input");
    expect(result.commandParts?.some((parts) => parts.at(-1) === target && parts.at(-2) === "--")).toBe(true);
  });
});

describe("registerCapture", () => {
  it("registers a capture command on the pi API", () => {
    const pi = {
      registerCommand: vi.fn(),
    } as unknown as import("@earendil-works/pi-coding-agent").ExtensionAPI;

    registerCapture(pi);
    expect(pi.registerCommand).toHaveBeenCalledWith(
      "capture",
      expect.objectContaining({
        description: "Unified evidence capture: executes the routed driver and validates produced artifacts",
      }),
    );
  });
});
