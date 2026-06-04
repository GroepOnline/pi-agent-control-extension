import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCli, parseSkillMd, type CliOptions } from "./cli.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh CLI with captured IO callbacks for isolation. */
function makeCli(argv: string[], overrides?: Partial<CliOptions>) {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const exitCalls: (number | undefined)[] = [];

  const cli = createCli({
    argv,
    stdout: (line) => stdoutLines.push(line),
    stderr: (line) => stderrLines.push(line),
    exit: (code?: number) => {
      exitCalls.push(code);
      // We never actually exit — the real process.exit is already patched
      // inside createCli.run() via the ExitSignal mechanism.
      return undefined as never;
    },
    ...overrides,
  });

  return {
    cli,
    stdoutLines,
    stderrLines,
    exitCalls,
    /** Convenience: run and return result + captured lines. */
    run() {
      const result = cli.run();
      return { result, stdoutLines, stderrLines, exitCalls };
    },
  };
}

// ---------------------------------------------------------------------------
// parseSkillMd
// ---------------------------------------------------------------------------

describe("parseSkillMd", () => {
  it("extracts name and description from YAML-like frontmatter", () => {
    const md = "name: My Skill\ndescription: Does cool things\n---\nBody";
    expect(parseSkillMd(md)).toEqual({
      name: "My Skill",
      description: "Does cool things",
    });
  });

  it("strips surrounding quotes from values", () => {
    const md = `name: "Quoted Name"\ndescription: 'Single Quoted'`;
    expect(parseSkillMd(md)).toEqual({
      name: "Quoted Name",
      description: "Single Quoted",
    });
  });

  it("returns empty strings when frontmatter is missing", () => {
    expect(parseSkillMd("Just plain markdown\nno frontmatter")).toEqual({
      name: "",
      description: "",
    });
  });

  it("handles name present but description missing", () => {
    const md = "name: Partial\n---\nBody";
    expect(parseSkillMd(md)).toEqual({
      name: "Partial",
      description: "",
    });
  });

  it("handles description present but name missing", () => {
    const md = "description: Only description\n---\nBody";
    expect(parseSkillMd(md)).toEqual({
      name: "",
      description: "Only description",
    });
  });
});

// ---------------------------------------------------------------------------
// Factory basics
// ---------------------------------------------------------------------------

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

  it("default command is 'help' when argv is undefined-element-free", () => {
    const cli = createCli({ argv: [""] });
    // Empty string argv[0] is falsy so defaults to 'help'
    expect(cli.command).toBe("help");
  });
});

// ---------------------------------------------------------------------------
// Help command
// ---------------------------------------------------------------------------

describe("createCli — help command", () => {
  it("prints help text to stdout (no exit code)", () => {
    const { result } = makeCli(["help"]).run();
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("view");
    expect(result.stdout).toContain("enable");
    expect(result.stdout).toContain("disable");
    expect(result.stdout).toContain("validate");
    expect(result.stdout).toContain("diff");
    expect(result.stdout).toContain("merge");
    expect(result.stdout).toContain("Options:");
    expect(result.exitCode).toBeNull();
  });

  it("-h prints help", () => {
    const { result } = makeCli(["-h"]).run();
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.exitCode).toBeNull();
  });

  it("--help prints help", () => {
    const { result } = makeCli(["--help"]).run();
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.exitCode).toBeNull();
  });

  it("help prints nothing to stderr", () => {
    const { result } = makeCli(["help"]).run();
    expect(result.stderr).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Unknown command
// ---------------------------------------------------------------------------

describe("createCli — unknown command", () => {
  it("prints error to stderr and exits with code 2", () => {
    const { result } = makeCli(["nonexistent"]).run();
    expect(result.stderr).toContain("Unknown skills command: nonexistent");
    expect(result.exitCode).toBe(2);
  });

  it("also prints help text to stdout after the error", () => {
    const { result } = makeCli(["nonexistent"]).run();
    // showHelp() uses console.log, so help text goes to stdout
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.stdout).toContain("Commands:");
  });

  it("empty-string command falls through to 'help' (no error)", () => {
    const { result } = makeCli([""]).run();
    expect(result.stdout).toContain("Pi Skills CLI");
    expect(result.exitCode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// List command
// ---------------------------------------------------------------------------

describe("createCli — list command", () => {
  it("lists skills to stdout", () => {
    const { result } = makeCli(["list"]).run();
    expect(result.stdout).toContain("Registered Skill Atoms");
    expect(result.exitCode).toBeNull();
  });

  it("--json outputs valid JSON array", () => {
    const { result } = makeCli(["list", "--json"]).run();
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(result.exitCode).toBeNull();
  });

  it("--json array entries have expected shape", () => {
    const { result } = makeCli(["list", "--json"]).run();
    const parsed = JSON.parse(result.stdout);
    if (parsed.length > 0) {
      const entry = parsed[0];
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("description");
      expect(entry).toHaveProperty("path");
      expect(entry).toHaveProperty("source");
      expect(entry).toHaveProperty("enabled");
      expect(entry).toHaveProperty("valid");
    }
  });

  it("--source pi filters to only pi-sourced skills", () => {
    const { result } = makeCli(["list", "--json", "--source", "pi"]).run();
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    for (const entry of parsed) {
      expect(entry.source).toBe("pi");
    }
  });

  it("--source user filters to only user-sourced skills", () => {
    const { result } = makeCli(["list", "--json", "--source", "user"]).run();
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    for (const entry of parsed) {
      expect(entry.source).toBe("user");
    }
  });

  it("--json does not appear in human-readable mode", () => {
    const { result } = makeCli(["list"]).run();
    // Human-readable mode contains colored output, not JSON
    expect(result.stdout).toContain("Registered Skill Atoms");
    // Should not be parseable as JSON (contains ANSI codes)
    expect(() => JSON.parse(result.stdout)).toThrow();
  });

  it("list prints nothing to stderr on success", () => {
    const { result } = makeCli(["list"]).run();
    expect(result.stderr).toBe("");
  });
});

// ---------------------------------------------------------------------------
// View command
// ---------------------------------------------------------------------------

describe("createCli — view command", () => {
  it("view without name prints error and exits 1", () => {
    const { result } = makeCli(["view"]).run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.stderr).toContain("skills view <name>");
    expect(result.exitCode).toBe(1);
  });

  it("view with nonexistent skill prints error and exits 1", () => {
    const { result } = makeCli(["view", "nonexistent-skill-xyz"]).run();
    expect(result.stderr).toContain("not found in registry");
    expect(result.exitCode).toBe(1);
  });

  it("view prints nothing to stdout when name is missing", () => {
    const { result } = makeCli(["view"]).run();
    expect(result.stdout).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Enable command
// ---------------------------------------------------------------------------

describe("createCli — enable command", () => {
  it("enable without name prints error and exits 1", () => {
    const { result } = makeCli(["enable"]).run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.stderr).toContain("skills enable <name>");
    expect(result.exitCode).toBe(1);
  });

  it("enable with nonexistent skill prints error and exits 1", () => {
    const { result } = makeCli(["enable", "nonexistent-skill-xyz"]).run();
    expect(result.stderr).toContain("not found in registry");
    expect(result.exitCode).toBe(1);
  });

  it("enable prints nothing to stdout when name is missing", () => {
    const { result } = makeCli(["enable"]).run();
    expect(result.stdout).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Disable command
// ---------------------------------------------------------------------------

describe("createCli — disable command", () => {
  it("disable without name prints error and exits 1", () => {
    const { result } = makeCli(["disable"]).run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.stderr).toContain("skills disable <name>");
    expect(result.exitCode).toBe(1);
  });

  it("disable with nonexistent skill prints error and exits 1", () => {
    const { result } = makeCli(["disable", "nonexistent-skill-xyz"]).run();
    expect(result.stderr).toContain("not found in registry");
    expect(result.exitCode).toBe(1);
  });

  it("disable prints nothing to stdout when name is missing", () => {
    const { result } = makeCli(["disable"]).run();
    expect(result.stdout).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Diff command
// ---------------------------------------------------------------------------

describe("createCli — diff command", () => {
  it("diff without name prints error and exits 1", () => {
    const { result } = makeCli(["diff"]).run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.stderr).toContain("skills diff <name>");
    expect(result.exitCode).toBe(1);
  });

  it("diff with nonexistent skill prints error and exits 1", () => {
    const { result } = makeCli(["diff", "nonexistent-skill-xyz"]).run();
    expect(result.stderr).toContain("not found in registry");
    expect(result.exitCode).toBe(1);
  });

  it("diff prints nothing to stdout when name is missing", () => {
    const { result } = makeCli(["diff"]).run();
    expect(result.stdout).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Merge command
// ---------------------------------------------------------------------------

describe("createCli — merge command", () => {
  it("merge without name prints error and exits 1", () => {
    const { result } = makeCli(["merge"]).run();
    expect(result.stderr).toContain("Missing skill name");
    expect(result.stderr).toContain("skills merge <name>");
    expect(result.exitCode).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Validate command
// ---------------------------------------------------------------------------

describe("createCli — validate command", () => {
  it("runs validation and outputs audit report", () => {
    const { result } = makeCli(["validate"]).run();
    expect(result.stdout).toContain("Auditing Skill Atoms");
    expect(result.stdout).toContain("Audit Complete");
    expect(result.exitCode).toBeNull();
  });

  it("validate prints nothing to stderr on success", () => {
    const { result } = makeCli(["validate"]).run();
    expect(result.stderr).toBe("");
  });

  it("validate with nonexistent skill name prints error and exits 1", () => {
    const { result } = makeCli(["validate", "nonexistent-skill-xyz"]).run();
    expect(result.stderr).toContain("not found in registry");
    expect(result.exitCode).toBe(1);
  });

  it("validate with specific valid skill name runs successfully", () => {
    // First find a skill name from the registry
    const listResult = makeCli(["list", "--json"]).run();
    const skills = JSON.parse(listResult.result.stdout);
    if (skills.length > 0) {
      const firstSkill = skills[0].name;
      const { result } = makeCli(["validate", firstSkill]).run();
      expect(result.stdout).toContain("Auditing Skill Atoms");
      expect(result.exitCode).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// stdout/stderr isolation
// ---------------------------------------------------------------------------

describe("createCli — IO isolation", () => {
  it("stdout callback receives all log output lines", () => {
    const stdoutLines: string[] = [];
    const cli = createCli({
      argv: ["help"],
      stdout: (line) => stdoutLines.push(line),
    });
    cli.run();
    expect(stdoutLines.length).toBeGreaterThan(0);
    expect(stdoutLines.join("")).toContain("Pi Skills CLI");
  });

  it("stderr callback receives error output lines", () => {
    const stderrLines: string[] = [];
    const cli = createCli({
      argv: ["nonexistent"],
      stderr: (line) => stderrLines.push(line),
    });
    cli.run();
    expect(stderrLines.length).toBeGreaterThan(0);
    expect(stderrLines.join("")).toContain("Unknown skills command");
  });

  it("stderr callback receives missing-argument errors", () => {
    const stderrLines: string[] = [];
    const cli = createCli({
      argv: ["view"],
      stderr: (line) => stderrLines.push(line),
    });
    cli.run();
    expect(stderrLines.join("")).toContain("Missing skill name");
  });

  it("multiple runs on same cli instance are isolated", () => {
    const stdout1: string[] = [];
    const stdout2: string[] = [];
    const cli = createCli({ argv: ["help"], stdout: (l) => stdout1.push(l) });
    cli.run();
    // Second run with different callback
    const cli2 = createCli({ argv: ["help"], stdout: (l) => stdout2.push(l) });
    cli2.run();
    expect(stdout1.length).toBeGreaterThan(0);
    expect(stdout2.length).toBeGreaterThan(0);
    // Both received output independently
    expect(stdout1.join("")).toContain("Pi Skills CLI");
    expect(stdout2.join("")).toContain("Pi Skills CLI");
  });

  it("real console.log is not polluted after run()", () => {
    const origLog = console.log;
    const { result } = makeCli(["help"]).run();
    // After run(), console.log should be restored
    expect(console.log).toBe(origLog);
    expect(result.exitCode).toBeNull();
  });

  it("real console.error is not polluted after run()", () => {
    const origErr = console.error;
    const { result } = makeCli(["nonexistent"]).run();
    expect(console.error).toBe(origErr);
    expect(result.exitCode).toBe(2);
  });

  it("real process.exit is not polluted after run()", () => {
    const origExit = process.exit;
    makeCli(["help"]).run();
    expect(process.exit).toBe(origExit);
  });
});

// ---------------------------------------------------------------------------
// Exit code verification
// ---------------------------------------------------------------------------

describe("createCli — exit codes", () => {
  it("success commands return null exit code (no exit)", () => {
    for (const cmd of [["help"], ["list"], ["validate"]]) {
      const { result } = makeCli(cmd).run();
      expect(result.exitCode).toBeNull();
    }
  });

  it("unknown command exits with code 2", () => {
    const { result } = makeCli(["bogus"]).run();
    expect(result.exitCode).toBe(2);
  });

  it("missing required argument exits with code 1", () => {
    for (const cmd of [["view"], ["enable"], ["disable"], ["diff"], ["merge"]]) {
      const { result } = makeCli(cmd).run();
      expect(result.exitCode).toBe(1);
    }
  });

  it("nonexistent skill name exits with code 1", () => {
    for (const cmd of [
      ["view", "no-such-skill"],
      ["enable", "no-such-skill"],
      ["disable", "no-such-skill"],
      ["diff", "no-such-skill"],
      ["validate", "no-such-skill"],
    ]) {
      const { result } = makeCli(cmd).run();
      expect(result.exitCode).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Error message content
// ---------------------------------------------------------------------------

describe("createCli — error message content", () => {
  it("unknown command includes command name in error", () => {
    const { result } = makeCli(["foobar"]).run();
    expect(result.stderr).toContain("foobar");
  });

  it("missing name errors include usage hint", () => {
    const expectedHints: Record<string, string> = {
      view: "skills view <name>",
      enable: "skills enable <name>",
      disable: "skills disable <name>",
      diff: "skills diff <name>",
      merge: "skills merge <name>",
    };
    for (const [cmd, hint] of Object.entries(expectedHints)) {
      const { result } = makeCli([cmd]).run();
      expect(result.stderr).toContain(hint);
    }
  });

  it("nonexistent skill errors include the skill name", () => {
    const { result } = makeCli(["view", "ghost-skill"]).run();
    expect(result.stderr).toContain("ghost-skill");
  });
});

// ---------------------------------------------------------------------------
// Argument parsing edge cases
// ---------------------------------------------------------------------------

describe("createCli — argument parsing edge cases", () => {
  it("extra args after subcommand are passed through", () => {
    const { result } = makeCli(["list", "--json", "--source", "pi"]).run();
    // Should produce JSON filtered to pi
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    for (const entry of parsed) {
      expect(entry.source).toBe("pi");
    }
  });

  it("--source without value does not crash", () => {
    // --source at end of args with no following value
    const { result } = makeCli(["list", "--source"]).run();
    // Should still list (filter is null when no value follows)
    expect(result.stdout).toContain("Registered Skill Atoms");
    expect(result.exitCode).toBeNull();
  });

  it("--json and --source user combined", () => {
    const { result } = makeCli(["list", "--json", "--source", "user"]).run();
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    for (const entry of parsed) {
      expect(entry.source).toBe("user");
    }
  });

  it("flags are not interpreted as subcommands", () => {
    // --json as first arg is treated as command "list" case? No, argv[0] is "--json"
    const { result } = makeCli(["--json"]).run();
    // "--json" is not a known command, so it goes to default
    expect(result.stderr).toContain("Unknown skills command: --json");
    expect(result.exitCode).toBe(2);
  });
});
