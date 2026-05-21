import { describe, it, expect } from "vitest";

// Re-implement the parsing logic from index.ts for testing purposes since it is not exported
function parseCommandArgs(command: string) {
  return command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((a) => a.replace(/^["']|["']$/g, "")) ?? [];
}

function buildExecArgs(p: { action: string; target?: string; args?: string[]; session?: string }) {
  const execArgs = [p.action];
  if (p.target !== undefined) execArgs.push(p.target);
  if (p.args !== undefined) execArgs.push(...p.args);
  if (p.session) execArgs.unshift("--session", p.session);
  return execArgs;
}

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

  it("handles multiple spaces between arguments", () => {
    const args = parseCommandArgs("open   https://example.com");
    expect(args).toEqual(["open", "https://example.com"]);
  });

  it("handles empty commands", () => {
    const args = parseCommandArgs("");
    expect(args).toEqual([]);
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
