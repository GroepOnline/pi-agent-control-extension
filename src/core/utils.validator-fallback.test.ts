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

describe("runValidator fallback", () => {
  it("returns fallback message when all python commands fail", () => {
    const result = runValidator();
    expect(result).toBe("Unable to run Python validator.");
  });
});
