import { describe, it, expect } from "vitest";

// Re-implement the parsing logic from index.ts for testing purposes since it is not exported
function parseCommandArgs(command: string) {
  return command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((a) => a.replace(/^["']|["']$/g, "")) ?? [];
}

const ALLOWED_COMMANDS = new Set(["open", "snapshot", "screenshot", "click", "fill", "close", "navigate", "wait", "extract"]);

function isCommandAllowed(command: string) {
  const args = parseCommandArgs(command);
  if (!args.length) return false;
  return ALLOWED_COMMANDS.has(args[0]);
}

function buildRejectionMessage(command: string) {
  const args = parseCommandArgs(command);
  const subcommand = args[0];
  const allowed = [...ALLOWED_COMMANDS].sort().join(", ");
  if (!subcommand) {
    return `No subcommand provided. Allowed commands: ${allowed}`;
  }
  return `Disallowed subcommand: "${subcommand}". Allowed commands: ${allowed}`;
}

describe("Browser Command Parsing", () => {
  it("splits simple commands correctly", () => {
    const args = parseCommandArgs("open https://example.com");
    expect(args).toEqual(["open", "https://example.com"]);
  });

  it("handles double-quoted strings as single arguments", () => {
    const args = parseCommandArgs('fill "hello world"');
    expect(args).toEqual(["fill", "hello world"]);
  });

  it("handles single-quoted strings as single arguments", () => {
    const args = parseCommandArgs("fill 'hello world'");
    expect(args).toEqual(["fill", "hello world"]);
  });

  it("handles complex combinations of quotes", () => {
    const args = parseCommandArgs('click button "submit form" \'extra arg\'');
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
});

describe("Browser Command Allowlist", () => {
  it("allows the open command", () => {
    expect(isCommandAllowed("open https://example.com")).toBe(true);
  });

  it("allows the snapshot command", () => {
    expect(isCommandAllowed("snapshot")).toBe(true);
  });

  it("allows the screenshot command", () => {
    expect(isCommandAllowed("screenshot --annotate")).toBe(true);
  });

  it("allows the click command", () => {
    expect(isCommandAllowed("click button #submit")).toBe(true);
  });

  it("allows the fill command", () => {
    expect(isCommandAllowed("fill '#name' John")).toBe(true);
  });

  it("allows the close command", () => {
    expect(isCommandAllowed("close")).toBe(true);
  });

  it("allows the navigate command", () => {
    expect(isCommandAllowed("navigate /dashboard")).toBe(true);
  });

  it("allows the wait command", () => {
    expect(isCommandAllowed("wait 2000")).toBe(true);
  });

  it("allows the extract command", () => {
    expect(isCommandAllowed("extract #price")).toBe(true);
  });

  it("rejects disallowed subcommand", () => {
    expect(isCommandAllowed("exec rm -rf /")).toBe(false);
  });

  it("rejects arbitrary shell commands", () => {
    expect(isCommandAllowed("rm -rf /")).toBe(false);
  });

  it("rejects empty command", () => {
    expect(isCommandAllowed("")).toBe(false);
  });

  it("builds correct rejection message for disallowed command", () => {
    const msg = buildRejectionMessage("exec malware");
    expect(msg).toContain('Disallowed subcommand: "exec"');
    expect(msg).toContain("Allowed commands:");
    expect(msg).toContain("click");
    expect(msg).toContain("close");
  });

  it("builds correct rejection message for empty command", () => {
    const msg = buildRejectionMessage("");
    expect(msg).toContain("No subcommand provided");
    expect(msg).toContain("Allowed commands:");
  });
});
