import { describe, it, expect } from "vitest";
import { createCli } from "./cli.ts";

describe("createCli — factory pattern", () => {
  it("returns a run function and parsed command", () => {
    const cli = createCli({ argv: ["list"] });
    expect(typeof cli.run).toBe("function");
    expect(cli.command).toBe("list");
  });

  it("default command is 'help' when argv is empty", () => {
    const cli = createCli({ argv: [] });
    expect(cli.command).toBe("help");
  });
});

describe("createCli — help command", () => {
  it("prints help text to stdout", () => {
    const cli = createCli({ argv: ["help"] });
    const result = cli.run();
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("view");
    expect(result.exitCode).toBeNull();
  });

  it("-h prints help", () => {
    const cli = createCli({ argv: ["-h"] });
    const result = cli.run();
    expect(result.stdout).toContain("Pi Skills CLI");
  });

  it("--help prints help", () => {
    const cli = createCli({ argv: ["--help"] });
    const result = cli.run();
    expect(result.stdout).toContain("Pi Skills CLI");
  });
});

describe("createCli — list command", () => {
  it("lists skills to stdout", () => {
    const cli = createCli({ argv: ["list"] });
    const result = cli.run();
    expect(result.stdout).toContain("Registered Skill Atoms");
    expect(result.exitCode).toBeNull();
  });

  it("--json outputs JSON array", () => {
    const cli = createCli({ argv: ["list", "--json"] });
    const result = cli.run();
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(result.exitCode).toBeNull();
  });
});

describe("createCli — unknown command", () => {
  it("prints error to stderr and exits with code 2", () => {
    const cli = createCli({ argv: ["nonexistent"] });
    const result = cli.run();
    expect(result.stderr).toContain("Unknown skills command: nonexistent");
    expect(result.exitCode).toBe(2);
  });
});

describe("createCli — missing argument errors", () => {
  it("view without name prints error and exits 1", () => {
    const cli = createCli({ argv: ["view"] });
    const result = cli.run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.exitCode).toBe(1);
  });

  it("enable without name prints error and exits 1", () => {
    const cli = createCli({ argv: ["enable"] });
    const result = cli.run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.exitCode).toBe(1);
  });

  it("disable without name prints error and exits 1", () => {
    const cli = createCli({ argv: ["disable"] });
    const result = cli.run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.exitCode).toBe(1);
  });

  it("diff without name prints error and exits 1", () => {
    const cli = createCli({ argv: ["diff"] });
    const result = cli.run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.exitCode).toBe(1);
  });

  it("merge without name prints error and exits 1", () => {
    const cli = createCli({ argv: ["merge"] });
    const result = cli.run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.exitCode).toBe(1);
  });
});

describe("createCli — validate command", () => {
  it("runs validation and outputs audit report", () => {
    const cli = createCli({ argv: ["validate"] });
    const result = cli.run();
    expect(result.stdout).toContain("Auditing Skill Atoms");
    expect(result.stdout).toContain("Audit Complete");
  });
});
