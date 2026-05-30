import { describe, it, expect, vi, beforeEach } from "vitest";
import { capture, parseCaptureArgs, routeToDriver, formatCaptureMarkdown, registerCapture } from "./capture.ts";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn((cmd: string) => {
    if (cmd === "which") throw new Error("not found");
    return "";
  }),
}));

vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
}));

vi.mock("./utils.ts", () => ({
  rootDir: vi.fn(() => "/mock/root"),
  shellEscape: vi.fn((s: string) => s),
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
    expect(result.commandParts).toBeDefined();
    expect(result.commandParts![0]).toContain("agent-browser");
    expect(result.commandParts![0]).toContain("https://example.com");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("returns a capture result for tuistory target", () => {
    const result = capture("run tui app", "cast");
    expect(result.driver).toBe("tuistory");
    expect(result.format).toBe("cast");
    expect(result.command).toContain("tctl");
    expect(result.commandParts).toBeDefined();
    expect(result.commandParts![0]).toContain("run tui app");
    expect(result.validated).toBe(true);
  });

  it("returns a capture result for true-input target", () => {
    const result = capture("real terminal test", "mp4");
    expect(result.driver).toBe("true-input");
    expect(result.format).toBe("mp4");
    expect(result.command).toContain("true-input");
    expect(result.commandParts).toBeDefined();
    expect(result.commandParts![0]).toContain("real terminal test");
    expect(result.validated).toBe(true);
  });

  it("validates evidence automatically", () => {
    const result = capture("https://example.com", "report");
    expect(result.validated).toBe(true);
  });

  it("includes warnings from routing and driver", () => {
    const result = capture("tctl launch some-task", "mp4");
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
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
    expect(md).toContain("Validated");
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

describe("commandParts security", () => {
  it("stores raw target in commandParts without shell interpolation", () => {
    const malicious = '"; rm -rf / #';
    const result = capture(malicious, "cast");
    expect(result.commandParts).toBeDefined();
    expect(result.commandParts![0]).toContain(malicious);
  });

  it("stores shell metacharacters literally in commandParts", () => {
    const payloads = [
      '$(whoami)',
      '`id`',
      '; echo pwned',
      '| cat /etc/passwd',
      '&& malicious',
    ];
    for (const payload of payloads) {
      const result = capture(payload, "cast");
      expect(result.commandParts).toBeDefined();
      expect(result.commandParts![0]).toContain(payload);
    }
  });

  it("uses -- flag terminator to prevent CLI flag injection in tuistory", () => {
    const flagInjection = "--backend evil";
    const result = capture(flagInjection, "cast");
    expect(result.commandParts).toBeDefined();
    const cmd = result.commandParts![0];
    const dashDashIdx = cmd.indexOf("--");
    expect(dashDashIdx).toBeGreaterThan(-1);
    expect(cmd[dashDashIdx + 1]).toBe(flagInjection);
  });

  it("uses -- flag terminator to prevent CLI flag injection in browser", () => {
    const flagInjection = "--viewport 9999x9999";
    const result = capture("https://example.com " + flagInjection, "png");
    expect(result.commandParts).toBeDefined();
    const cmd = result.commandParts![0];
    const dashDashIdx = cmd.indexOf("--");
    expect(dashDashIdx).toBeGreaterThan(-1);
  });

  it("uses -- flag terminator to prevent CLI flag injection in true-input", () => {
    const flagInjection = "--record /tmp/evil";
    const result = capture("ghostty key encoding " + flagInjection, "mp4");
    expect(result.driver).toBe("true-input");
    expect(result.commandParts).toBeDefined();
    const cmd = result.commandParts![0];
    const dashDashIdx = cmd.indexOf("--");
    expect(dashDashIdx).toBeGreaterThan(-1);
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
        description: "Unified evidence capture: kiest driver + format automatisch",
      }),
    );
  });
});
