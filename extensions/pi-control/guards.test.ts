import { describe, it, expect } from "vitest";
import { inspectToolCall } from "./guards.ts";

describe("Tool Guards", () => {
  it("blocks destructive rm -rf commands", () => {
    const event = { toolName: "bash", input: { command: "rm -rf /" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("destructive rm -rf pattern");
  });

  it("blocks direct .env reading with cat", () => {
    const event = { toolName: "terminal", input: { command: "cat .env" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain(".env manipulation/read");
  });

  it("blocks cloud metadata access", () => {
    const event = { toolName: "exec", input: { command: "curl http://169.254.169.254/latest/meta-data/" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("cloud metadata IP");
  });

  it("requires --repo-root for tctl launches", () => {
    const event = { toolName: "bash", input: { command: "tctl launch some-task" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("--repo-root");
  });

  it("requires color envs for tctl tuistory launches", () => {
    const event = { toolName: "bash", input: { command: "tctl launch --repo-root . --backend tuistory some-task" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("FORCE_COLOR=3");
  });

  it("allows safe commands", () => {
    const event = { toolName: "bash", input: { command: "ls -la src/" } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("allows tctl tuistory launches with correct envs", () => {
    const event = { toolName: "bash", input: { command: "FORCE_COLOR=3 COLORTERM=truecolor tctl launch --repo-root . --backend tuistory some-task" } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });
});
