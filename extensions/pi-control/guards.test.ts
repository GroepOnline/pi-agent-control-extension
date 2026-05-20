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

  it("handles non-object inputs gracefully", () => {
    const event = { toolName: "bash", input: "not-an-object" };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("handles undefined inputs gracefully", () => {
    const event = { toolName: "bash" };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("handles alternative command keys like cmd", () => {
    const event = { toolName: "bash", input: { cmd: "rm -rf /" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
  });

  it("handles alternative command keys like script", () => {
    const event = { toolName: "bash", input: { script: "rm -rf /" } };
    const result = inspectToolCall(event);
    expect(result).not.toBeNull();
    expect(result?.block).toBe(true);
  });

  it("handles non-string values gracefully", () => {
    const event = { toolName: "bash", input: { command: 123 } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("returns null if no toolName matches bash shell terminal exec", () => {
    const event = { toolName: "other", input: { command: "rm -rf /" } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("returns null if no command is found", () => {
    const event = { toolName: "bash", input: { arg: "value" } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });

  it("handles event without toolName but with command", () => {
    const event = { input: { command: "ls" } };
    const result = inspectToolCall(event);
    expect(result).toBeNull();
  });
});
