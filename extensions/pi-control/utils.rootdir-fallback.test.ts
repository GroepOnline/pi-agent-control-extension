import { describe, it, expect, vi } from "vitest";
import { existsSync } from "node:fs";

describe("rootDir fallback", () => {
  it("falls back to PACKAGE_ROOT when no package.json is found", async () => {
    vi.resetModules();
    vi.doMock("node:fs", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:fs")>();
      return {
        ...actual,
        existsSync: vi.fn((p: string) => {
          if (typeof p === "string" && p.endsWith("package.json")) {
            return false;
          }
          return actual.existsSync(p);
        }),
      };
    });

    const utils = await import("./utils.ts");
    const result = utils.rootDir();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    vi.doUnmock("node:fs");
  });
});
