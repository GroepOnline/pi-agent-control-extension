import { describe, it, expect, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { runValidator } from "./utils.ts";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Return true for the validator script path, false for others
      if (typeof path === "string" && path.includes("validate-package.py")) {
        return true;
      }
      return actual.existsSync(path);
    }),
  };
});

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: vi.fn(() => {
      throw new Error("command not found");
    }),
  };
});

const mockedExec = vi.mocked(execFileSync);

function exitError({
  status = 1,
  signal = null,
  stdout = "",
  stderr = "",
}: {
  status?: number | null;
  signal?: string | null;
  stdout?: string;
  stderr?: string;
} = {}) {
  return Object.assign(new Error("validator failed"), { status, signal, stdout, stderr });
}

describe("runValidator fallback", () => {
  it("returns fallback message when all python commands fail", () => {
    const result = runValidator();
    expect(result).toBe("Unable to run Python validator. [FAIL]");
  });

  it("marks a crashed validator FAIL even with partial [OK] stdout", () => {
    mockedExec.mockImplementation(() => {
      throw exitError({ stdout: "[OK] required files\n[OK] manifest\n", stderr: "Traceback...\nKeyError: 'name'" });
    });
    const result = runValidator();
    expect(result).toContain("[OK] required files");
    expect(result).toContain("[FAIL]");
    expect(result).toContain("KeyError: 'name'");
    expect(result).not.toBe("Unable to run Python validator. [FAIL]");
  });

  it("marks a validator killed by signal FAIL without partial stdout", () => {
    mockedExec.mockImplementation(() => {
      throw exitError({ status: null, signal: "SIGTERM" });
    });
    const result = runValidator();
    expect(result).toContain("[FAIL]");
    expect(result).toContain("SIGTERM");
  });

  it("reserves the clean report for a zero exit", () => {
    mockedExec.mockImplementation(() => "[OK] all checks\n");
    expect(runValidator()).toBe("[OK] all checks");
  });
});
