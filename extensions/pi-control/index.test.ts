import { describe, it, expect } from "vitest";

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
});
