import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import agyControlExtension from "./index.ts";

describe("agyControlExtension", () => {
  let mockPi: any;
  let registeredCommands: Record<string, any> = {};

  beforeEach(() => {
    registeredCommands = {};
    mockPi = {
      on: vi.fn(),
      registerCommand: vi.fn((name, config) => {
        registeredCommands[name] = config;
      }),
      registerTool: vi.fn(),
      registerIntent: vi.fn(),
      registerView: vi.fn(),
    };
  });

  it("registers all expected commands", () => {
    agyControlExtension(mockPi as unknown as ExtensionAPI);

    const expectedCommands = [
      "route-control",
      "skills-control",
      "demo-control",
      "verify-control",
      "qa-control",
      "doctor-control",
      "usage",
      "control-hub",
      "parallel-qa",
      "browser-control",
      "skill-studio",
      "recipe-list",
      "evidence-new",
      "tctl-status",
      "skill-diff",
      "skill-search",
      "skill-info",
      "preset-list",
      "transition-list",
      "showcase-preview",
      "showcase-render",
      "skill-merge",
      "merge-list",
    ];

    for (const cmd of expectedCommands) {
      expect(registeredCommands[cmd]).toBeDefined();
      expect(registeredCommands[cmd].description).toBeDefined();
      expect(typeof registeredCommands[cmd].handler).toBe("function");
    }
  });

  it("registers event listeners", () => {
    agyControlExtension(mockPi as unknown as ExtensionAPI);
    expect(mockPi.on).toHaveBeenCalledWith("session_start", expect.any(Function));
    expect(mockPi.on).toHaveBeenCalledWith("tool_call", expect.any(Function));
  });
});
