import { describe, it, expect, vi, beforeEach } from "vitest";
import { browserCommandTool, ALLOWED_ACTIONS } from "./browser_command.ts";
import * as child_process from "node:child_process";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

describe("ALLOWED_ACTIONS", () => {
  it("contains the expected set of actions", () => {
    expect(ALLOWED_ACTIONS).toEqual(["open", "snapshot", "click", "fill", "screenshot", "close"]);
  });

  it("is a frozen-like array (read-only by convention)", () => {
    expect(ALLOWED_ACTIONS).toHaveLength(6);
  });
});

describe("browserCommandTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has the correct name", () => {
    expect(browserCommandTool.name).toBe("control_browser_command");
  });

  it("has a non-empty description", () => {
    expect(browserCommandTool.description.length).toBeGreaterThan(0);
  });

  it("has a label", () => {
    expect(browserCommandTool.label).toBe("Browser Command");
  });

  describe("action validation", () => {
    it("rejects an invalid action", async () => {
      const result = await browserCommandTool.execute("id", { action: "invalid-action" });
      expect(result.content[0].text).toContain("Error");
      expect(result.content[0].text).toContain("invalid-action");
      expect(result.details.success).toBe(false);
      expect(result.details.error).toBe("Invalid action");
    });

    it("lists allowed actions in the error message", async () => {
      const result = await browserCommandTool.execute("id", { action: "hack" });
      expect(result.content[0].text).toContain("open");
      expect(result.content[0].text).toContain("snapshot");
      expect(result.content[0].text).toContain("click");
      expect(result.content[0].text).toContain("fill");
      expect(result.content[0].text).toContain("screenshot");
      expect(result.content[0].text).toContain("close");
    });

    it.each(ALLOWED_ACTIONS)("accepts the valid action '%s'", async (action) => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      const result = await browserCommandTool.execute("id", { action });
      expect(result.details.success).toBe(true);
    });
  });

  describe("argument building", () => {
    it("passes action as first argument", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot" });
      expect(child_process.execFileSync).toHaveBeenCalledWith(
        "agent-browser",
        expect.arrayContaining(["snapshot"]),
        expect.any(Object),
      );
    });

    it("includes target as second argument when provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "open", target: "https://example.com" });
      expect(child_process.execFileSync).toHaveBeenCalledWith(
        "agent-browser",
        expect.arrayContaining(["open", "https://example.com"]),
        expect.any(Object),
      );
    });

    it("appends additional args after target", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "click", target: "@e1", args: ["--wait", "5000"] });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).toContain("click");
      expect(callArgs).toContain("@e1");
      expect(callArgs).toContain("--wait");
      expect(callArgs).toContain("5000");
    });

    it("does not include target when not provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).toEqual(["snapshot"]);
    });

    it("does not include extra args when not provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "close" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).toEqual(["close"]);
    });
  });

  describe("session handling", () => {
    it("prepends --session flag when session is provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot", session: "my-session" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs[0]).toBe("--session");
      expect(callArgs[1]).toBe("my-session");
      expect(callArgs[2]).toBe("snapshot");
    });

    it("does not add --session when session is not provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).not.toContain("--session");
    });

    it("does not add --session when session is empty string", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot", session: "" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).not.toContain("--session");
    });
  });

  describe("proxy / Tor handling", () => {
    it("uses custom proxyPort when provided", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "open", target: "https://example.com", proxyPort: 9053 });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs[0]).toBe("--proxy");
      expect(callArgs[1]).toBe("socks5://127.0.0.1:9053");
    });

    it("picks a random Tor port when useTor is true and no proxyPort", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "open", target: "https://example.com", useTor: true });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs[0]).toBe("--proxy");
      expect(callArgs[1]).toMatch(/^socks5:\/\/127\.0\.0\.1:905[0-4]$/);
    });

    it("prefers proxyPort over useTor", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "open", target: "https://example.com", proxyPort: 8080, useTor: true });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs[0]).toBe("--proxy");
      expect(callArgs[1]).toBe("socks5://127.0.0.1:8080");
    });

    it("does not add proxy when neither useTor nor proxyPort is set", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "open", target: "https://example.com" });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      expect(callArgs).not.toContain("--proxy");
    });
  });

  describe("proxy + session combined", () => {
    it("applies both session and proxy in correct order", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", {
        action: "open",
        target: "https://example.com",
        session: "s1",
        proxyPort: 9050,
      });
      const callArgs = vi.mocked(child_process.execFileSync).mock.calls[0][1] as string[];
      // session unshift first, then proxy unshift, so proxy ends up first
      expect(callArgs[0]).toBe("--proxy");
      expect(callArgs[1]).toBe("socks5://127.0.0.1:9050");
      expect(callArgs[2]).toBe("--session");
      expect(callArgs[3]).toBe("s1");
      expect(callArgs[4]).toBe("open");
    });
  });

  describe("execFileSync success", () => {
    it("returns trimmed output on success", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("  Page loaded  \n");
      const result = await browserCommandTool.execute("id", { action: "open", target: "https://example.com" });
      expect(result.content[0].text).toBe("Page loaded");
      expect(result.details.success).toBe(true);
      expect(result.details.error).toBe("");
    });

    it("passes correct exec options", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      await browserCommandTool.execute("id", { action: "snapshot" });
      expect(child_process.execFileSync).toHaveBeenCalledWith(
        "agent-browser",
        expect.any(Array),
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 30000,
        }),
      );
    });
  });

  describe("execFileSync failure", () => {
    it("returns error message from stderr when available", async () => {
      const error = new Error("Command failed") as any;
      error.stderr = "agent-browser: command not found";
      vi.mocked(child_process.execFileSync).mockImplementation(() => {
        throw error;
      });

      const result = await browserCommandTool.execute("id", { action: "open", target: "https://example.com" });
      expect(result.content[0].text).toContain("Error");
      expect(result.content[0].text).toContain("agent-browser: command not found");
      expect(result.details.success).toBe(false);
    });

    it("falls back to error.message when no stderr", async () => {
      const error = new Error("ENOENT: agent-browser not found");
      vi.mocked(child_process.execFileSync).mockImplementation(() => {
        throw error;
      });

      const result = await browserCommandTool.execute("id", { action: "open", target: "https://example.com" });
      expect(result.content[0].text).toContain("Error");
      expect(result.content[0].text).toContain("ENOENT: agent-browser not found");
      expect(result.details.success).toBe(false);
      expect(result.details.error).toBe("ENOENT: agent-browser not found");
    });

    it("includes original action and target in error details", async () => {
      const error = new Error("timeout");
      vi.mocked(child_process.execFileSync).mockImplementation(() => {
        throw error;
      });

      const result = await browserCommandTool.execute("id", { action: "click", target: "@button" });
      expect(result.details.action).toBe("click");
      expect(result.details.target).toBe("@button");
      expect(result.details.success).toBe(false);
    });
  });

  describe("content format", () => {
    it("always returns content as an array with type text", async () => {
      vi.mocked(child_process.execFileSync).mockReturnValue("ok\n");
      const result = await browserCommandTool.execute("id", { action: "close" });
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0]).toHaveProperty("text");
    });
  });
});
