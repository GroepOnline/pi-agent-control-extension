import { describe, it, expect } from "vitest";

// Re-implement the parsing logic from index.ts for testing purposes since it is not exported
function parseCommandArgs(command: string) {
  return command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((a) => a.replace(/^["']|["']$/g, "")) ?? [];
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
