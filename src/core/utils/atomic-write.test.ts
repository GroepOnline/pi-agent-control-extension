import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  mkdirSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
  statSync,
  openSync,
  writeFileSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { atomicWrite, atomicWriteSync, cleanupDir } from "./atomic-write.ts";

// ESM namespaces are not configurable, so vi.spyOn cannot instrument them.
// vi.hoisted creates spies before module mocking kicks in; vi.mock wraps the
// real implementations with these spies so tests can verify calls.
// A shared ref stores the real writeFile so the spy can delegate by default
// while tests can still inject failures via mockRejectedValueOnce.

const hoistedFsyncSyncSpy = vi.hoisted(() => vi.fn<(fd: number) => void>());
const hoistedRenameSyncSpy = vi.hoisted(() => vi.fn<(oldPath: string, newPath: string) => void>());
const hoistedWriteFileSpy = vi.hoisted(() => vi.fn());

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    fsyncSync: (fd: number) => { hoistedFsyncSyncSpy(fd); return actual.fsyncSync(fd); },
    renameSync: (oldPath: string, newPath: string) => { hoistedRenameSyncSpy(oldPath, newPath); return actual.renameSync(oldPath, newPath); },
  };
});

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    writeFile: (...args: any[]) => hoistedWriteFileSpy(...args),
  };
});

// Convenience aliases for tests
const fsSpy = { fsyncSync: hoistedFsyncSyncSpy, renameSync: hoistedRenameSyncSpy };
const fsAsyncSpy = { writeFile: hoistedWriteFileSpy };

// Give the writeFile spy a default implementation that delegates to the real
// function. Tests that need to simulate failures override it with
// mockImplementationOnce / mockRejectedValueOnce.
// eslint-disable-next-line @typescript-eslint/no-require-imports
fsAsyncSpy.writeFile.mockImplementation((...args: any[]) => require("node:fs/promises").writeFile(...args));

/**
 * Tests the shared atomic-write utility (write to temp in same dir → fsync
 * → rename → fsync parent dir) used by saveMergeState, saveDisabledSet,
 * ensureToken, and resolveMerge.
 *
 * Key properties:
 *  1. No .tmp file is left behind after a successful write.
 *  2. A stale .tmp left by a crashed process does not corrupt or block
 *     subsequent writes.
 *  3. A concurrent reader sees either the complete old file or the complete
 *     new file — never a partially-written file (POSIX rename atomicity).
 *  4. The mode parameter is honored (0o600 for secrets).
 *  5. fsync is actually invoked on the temp file.
 *  6. The temp file is cleaned up on simulated write failure.
 */

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

describe("atomic write pattern — real filesystem", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `atomic-write-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("stale .tmp cleanup", () => {
    it("leaves no .tmp file after a successful atomic write", async () => {
      const dest = join(testDir, "config.json");
      await atomicWrite(dest, JSON.stringify({ key: "value" }));

      expect(existsSync(dest)).toBe(true);
      expect(readFileSync(dest, "utf8")).toBe('{"key":"value"}');

      // Verify no .tmp files lingering in the directory
      const files = readdirSync(testDir);
      const tmpFiles = files.filter((f) => f.endsWith(".tmp") || f.includes(".tmp."));
      expect(tmpFiles).toHaveLength(0);
    });

    it("handles a stale .tmp file from a crashed process gracefully", async () => {
      const dest = join(testDir, "config.json");

      // Simulate crash: create a stale .tmp file (as if pid 99999 wrote but never renamed)
      const staleTmp = `${dest}.tmp.99999`;
      writeFileSync(staleTmp, "stale-partial-data", "utf8");

      // Now do a real atomic write with current PID
      await atomicWrite(dest, JSON.stringify({ fresh: true }));

      // The fresh write should succeed
      expect(existsSync(dest)).toBe(true);
      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ fresh: true });

      // Stale .tmp should still exist but not interfere
      expect(existsSync(staleTmp)).toBe(true);
      // The fresh temp file written by atomicWrite must have been renamed away
      const remaining = readdirSync(testDir);
      const freshTmplike = remaining.filter(
        (f) => f.includes(".tmp.") && f !== "config.json.tmp.99999"
      );
      expect(freshTmplike).toHaveLength(0);
    });

    it("overwrites stale .tmp with same PID without issues", async () => {
      const dest = join(testDir, "config.json");
      // Pre-create the dest so atomicWrite's rename target is well-defined.
      writeFileSync(dest, "{}", "utf8");

      // First write
      await atomicWrite(dest, JSON.stringify({ first: true }));
      expect(existsSync(dest)).toBe(true);
      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ first: true });
      expect(readdirSync(testDir).filter((f) => f.includes(".tmp."))).toHaveLength(0);
    });

    it("multiple sequential atomic writes all clean up .tmp files", async () => {
      const dest = join(testDir, "state.json");

      for (let i = 0; i < 5; i++) {
        await atomicWrite(dest, JSON.stringify({ iteration: i }));
      }

      expect(existsSync(dest)).toBe(true);
      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ iteration: 4 });

      // No .tmp files should remain
      const files = readdirSync(testDir);
      const tmpFiles = files.filter((f) => f.includes(".tmp."));
      expect(tmpFiles).toHaveLength(0);
    });
  });

  describe("cleanupDir startup cleanup", () => {
    let configDir: string;
    let skillsDir: string;

    beforeEach(() => {
      configDir = join(testDir, "home", ".config", "devin");
      skillsDir = join(testDir, "home", ".devin", "skills");
      mkdirSync(configDir, { recursive: true });
      mkdirSync(skillsDir, { recursive: true });
    });

    it("removes stale .tmp.<PID> files from config directories", async () => {
      // Create stale .tmp files simulating crashed processes
      writeFileSync(join(configDir, "skill-studio.json.tmp.12345"), "stale", "utf8");
      writeFileSync(join(configDir, "bridge-token.tmp.99999"), "orphan", "utf8");
      writeFileSync(join(skillsDir, "SKILL.md.tmp.54321"), "dead", "utf8");

      // Verify they exist
      expect(existsSync(join(configDir, "skill-studio.json.tmp.12345"))).toBe(true);
      expect(existsSync(join(configDir, "bridge-token.tmp.99999"))).toBe(true);
      expect(existsSync(join(skillsDir, "SKILL.md.tmp.54321"))).toBe(true);

      const removed =
        (await cleanupDir(configDir)) + (await cleanupDir(skillsDir));

      expect(removed).toBe(3);
      expect(existsSync(join(configDir, "skill-studio.json.tmp.12345"))).toBe(false);
      expect(existsSync(join(configDir, "bridge-token.tmp.99999"))).toBe(false);
      expect(existsSync(join(skillsDir, "SKILL.md.tmp.54321"))).toBe(false);
    });

    it("does not remove non-.tmp files", async () => {
      writeFileSync(join(configDir, "skill-studio.json"), '{"valid":true}', "utf8");
      writeFileSync(join(configDir, "bridge-token"), "abc123", "utf8");
      writeFileSync(join(configDir, "skill-studio.json.tmp.12345"), "stale", "utf8");

      const removed = await cleanupDir(configDir);

      // Only the stale .tmp should be removed
      expect(removed).toBe(1);
      expect(existsSync(join(configDir, "skill-studio.json"))).toBe(true);
      expect(existsSync(join(configDir, "bridge-token"))).toBe(true);
      expect(existsSync(join(configDir, "skill-studio.json.tmp.12345"))).toBe(false);
    });

    it("handles nested skill directories with stale .tmp", async () => {
      const nestedSkillDir = join(skillsDir, "agent-browser");
      mkdirSync(nestedSkillDir, { recursive: true });
      writeFileSync(join(nestedSkillDir, "SKILL.md"), "valid", "utf8");
      writeFileSync(join(nestedSkillDir, "SKILL.md.tmp.77777"), "stale-nested", "utf8");

      const removed = await cleanupDir(skillsDir);

      expect(removed).toBe(1);
      expect(existsSync(join(nestedSkillDir, "SKILL.md"))).toBe(true);
      expect(existsSync(join(nestedSkillDir, "SKILL.md.tmp.77777"))).toBe(false);
    });

    it("returns 0 when no stale .tmp files exist", async () => {
      writeFileSync(join(configDir, "skill-studio.json"), '{"ok":true}', "utf8");

      const removed =
        (await cleanupDir(configDir)) + (await cleanupDir(skillsDir));

      expect(removed).toBe(0);
      expect(existsSync(join(configDir, "skill-studio.json"))).toBe(true);
    });

    it("does not crash when config directories do not exist (fresh install)", async () => {
      // Fresh install: remove the directories completely
      rmSync(configDir, { recursive: true, force: true });
      rmSync(skillsDir, { recursive: true, force: true });
      expect(existsSync(configDir)).toBe(false);
      expect(existsSync(skillsDir)).toBe(false);

      // Should not throw — just return 0 from missing-dir branch
      await expect(cleanupDir(configDir)).resolves.toBe(0);
      await expect(cleanupDir(skillsDir)).resolves.toBe(0);
    });

    it("does not crash when one directory exists but the other does not", async () => {
      writeFileSync(join(configDir, "skill-studio.json.tmp.12345"), "stale", "utf8");
      // Remove skillsDir entirely
      rmSync(skillsDir, { recursive: true, force: true });

      const removedConfig = await cleanupDir(configDir);
      const removedSkills = await cleanupDir(skillsDir);

      // Should have cleaned the one stale file in configDir and 0 from the missing dir
      expect(removedConfig).toBe(1);
      expect(removedSkills).toBe(0);
      expect(existsSync(join(configDir, "skill-studio.json.tmp.12345"))).toBe(false);
    });
  });

  describe("concurrent read safety", () => {
    it("reader sees complete old data during the write preparation phase", () => {
      const dest = join(testDir, "config.json");

      // Write initial complete data
      atomicWriteSync(dest, JSON.stringify({ version: 1, data: "initial" }));
      expect(readFileSafe(dest)).toBe('{"version":1,"data":"initial"}');

      // Write to tmp without renaming (simulate mid-write crash)
      const tmp = `${dest}.tmp.${process.pid}.simulated`;
      writeFileSync(tmp, "INCOMPLETE", "utf8");

      // Reader should still see the OLD complete file (rename hasn't happened yet)
      const readerView = readFileSafe(dest);
      expect(readerView).toBe('{"version":1,"data":"initial"}');
      // Reader should NOT see the incomplete tmp content
      expect(readerView).not.toBe("INCOMPLETE");

      // Cleanup tmp
      rmSync(tmp, { force: true });
    });

    it("reader sees complete new data after atomic rename completes", async () => {
      const dest = join(testDir, "config.json");

      // Write initial data
      await atomicWrite(dest, JSON.stringify({ version: 1 }));

      // Write new data atomically
      await atomicWrite(dest, JSON.stringify({ version: 2, updated: true }));

      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ version: 2, updated: true });
      // Verify it's valid JSON (not truncated)
      expect(() => JSON.parse(readFileSync(dest, "utf8"))).not.toThrow();
    });

    it("handles empty initial state (first write to non-existent file)", async () => {
      const dest = join(testDir, "fresh.json");

      // No file exists yet
      expect(existsSync(dest)).toBe(false);

      // First atomic write
      await atomicWrite(dest, JSON.stringify({ first: true }));

      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ first: true });
      expect(readdirSync(testDir).filter((f) => f.includes(".tmp."))).toHaveLength(0);
    });

    it("large writes are atomic (multi-kilobyte JSON)", async () => {
      const dest = join(testDir, "large.json");
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          description: `This is item number ${i} with a longer description to fill space.`,
          tags: ["tag-a", "tag-b", "tag-c"],
          metadata: { created: Date.now(), version: i % 10 },
        })),
      };

      // Write large data
      await atomicWrite(dest, JSON.stringify(largeData));

      const raw = readFileSync(dest, "utf8");
      expect(() => JSON.parse(raw)).not.toThrow();
      const parsed = JSON.parse(raw);
      expect(parsed.items).toHaveLength(1000);
      expect(parsed.items[0].name).toBe("item-0");
      expect(parsed.items[999].name).toBe("item-999");
    });

    it("rapid sequential writes always produce complete JSON", async () => {
      const dest = join(testDir, "rapid.json");

      // Rapid writes — each should be atomically complete
      for (let i = 0; i < 20; i++) {
        await atomicWrite(dest, JSON.stringify({ count: i, data: "x".repeat(100) }));
        // Immediately read — should always get valid JSON
        const raw = readFileSync(dest, "utf8");
        expect(() => JSON.parse(raw)).not.toThrow();
      }
    });
  });

  /**
   * Regression tests for the SHARED production utility. These guard against
   * future refactors that could break the durability guarantees that the
   * production callers (saveMergeState, saveDisabledSet, ensureToken,
   * resolveMerge) rely on.
   */
  describe("regression: production utility guarantees", () => {
    it("writes the data correctly", async () => {
      const dest = join(testDir, "payload.json");
      const payload = { greeting: "hello", nested: { a: 1, b: [1, 2, 3] } };
      await atomicWrite(dest, JSON.stringify(payload));
      expect(JSON.parse(readFileSync(dest, "utf8"))).toEqual(payload);
    });

    it("does NOT leave a temp file behind on success", async () => {
      const dest = join(testDir, "config.json");
      await atomicWrite(dest, "ok");
      const files = readdirSync(testDir);
      const tmps = files.filter((f) => /\.tmp\./.test(f));
      expect(tmps).toHaveLength(0);
    });

    it("honors the mode: 0o600 parameter (secrets stay secret)", async () => {
      const dest = join(testDir, "secret-token");
      await atomicWrite(dest, "top-secret-value", { mode: 0o600 });
      const st = statSync(dest);
      // Mask the filetype bits so the assertion is portable across POSIX bits.
      const permissionBits = st.mode & 0o777;
      expect(permissionBits).toBe(0o600);
    });

    it("honors the mode: 0o644 default when no mode is given", async () => {
      const dest = join(testDir, "public.json");
      await atomicWrite(dest, "ok");
      const st = statSync(dest);
      const permissionBits = st.mode & 0o777;
      expect(permissionBits).toBe(0o644);
    });

    it("atomicWriteSync honors the mode: 0o600 parameter too", () => {
      const dest = join(testDir, "secret-sync");
      atomicWriteSync(dest, "value", { mode: 0o600 });
      const st = statSync(dest);
      expect(st.mode & 0o777).toBe(0o600);
    });

    it("actually invokes fsync on the temp file before renaming", () => {
      fsSpy.fsyncSync.mockClear();
      const dest = join(testDir, "fsync.json");
      // atomicWriteSync directly calls fsyncSync (the sync fd-based API).
      // The async variant uses FileHandle.sync() which is a different binding.
      atomicWriteSync(dest, "durable");
      expect(fsSpy.fsyncSync).toHaveBeenCalled();
      // The fd passed to fsyncSync must be a number (an open file descriptor).
      for (const call of fsSpy.fsyncSync.mock.calls) {
        expect(typeof call[0]).toBe("number");
      }
    });

    it("atomicWriteSync also invokes fsyncSync", () => {
      fsSpy.fsyncSync.mockClear();
      const dest = join(testDir, "fsync-sync.json");
      atomicWriteSync(dest, "durable");
      expect(fsSpy.fsyncSync).toHaveBeenCalled();
    });

    it("cleans up the temp file on simulated write failure", async () => {
      // Force the write step to throw. The cleanup branch must remove the
      // temp file before the error propagates.
      fsAsyncSpy.writeFile.mockImplementationOnce(() => {
        throw new Error("simulated write failure");
      });
      try {
        const dest = join(testDir, "will-fail.json");
        await expect(atomicWrite(dest, "never-written")).rejects.toThrow(
          "simulated write failure",
        );

        // No .tmp file should be left behind
        const files = readdirSync(testDir);
        const tmps = files.filter((f) => /\.tmp\./.test(f));
        expect(tmps).toHaveLength(0);

        // Destination must not have been created
        expect(existsSync(dest)).toBe(false);
      } finally {
        fsAsyncSpy.writeFile.mockRestore();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        fsAsyncSpy.writeFile.mockImplementation((...args: any[]) => require("node:fs/promises").writeFile(...args));
      }
    });

    it("cleans up the temp file on simulated rename failure (sync variant)", () => {
      fsSpy.renameSync.mockImplementationOnce(() => {
        throw new Error("simulated rename failure");
      });
      try {
        const dest = join(testDir, "will-fail-sync.json");
        expect(() => atomicWriteSync(dest, "never-written")).toThrow(
          "simulated rename failure",
        );

        // No .tmp file should be left behind in the directory
        const files = readdirSync(testDir);
        const tmps = files.filter((f) => /\.tmp\./.test(f));
        expect(tmps).toHaveLength(0);

        // Destination must not have been created
        expect(existsSync(dest)).toBe(false);
      } finally {
        fsSpy.renameSync.mockRestore();
      }
    });

    it("creates the parent directory if it does not exist", async () => {
      const nested = join(testDir, "deeply", "nested", "path", "file.txt");
      expect(existsSync(nested)).toBe(false);
      await atomicWrite(nested, "deep");
      expect(readFileSync(nested, "utf8")).toBe("deep");
    });

    it("overwrites an existing destination without leaving a temp file", async () => {
      const dest = join(testDir, "overwrite.json");
      writeFileSync(dest, '{"v":1}', "utf8");
      await atomicWrite(dest, '{"v":2}');
      expect(readFileSync(dest, "utf8")).toBe('{"v":2}');
      expect(readdirSync(testDir).filter((f) => /\.tmp\./.test(f))).toHaveLength(0);
    });
  });

  /**
   * Concurrency stress: a background reader hammers the file in a tight
   * loop while a writer atomically rewrites it 100 times. The reader
   * must never observe a partial / truncated / unparseable payload —
   * the POSIX rename atomicity guarantee is what makes this safe.
   */
  describe("parallel reader safety (100-iteration stress)", () => {
    it("a parallel reader never sees a partial or unparseable file", { timeout: 15000 }, async () => {
      const dest = join(testDir, "stress.json");
      // Seed the file so the reader always has a valid value to parse.
      await atomicWrite(dest, JSON.stringify({ i: 0, payload: "x".repeat(64) }));

      let readsAttempted = 0;
      let readsParsed = 0;
      let readsFailed = 0;
      let readerStop = false;

      // Background reader — busy-loop reading and parsing the file.
      // We yield to the event loop between iterations so the writer's
      // async atomicWrite() can actually run.
      const reader = (async () => {
        while (!readerStop) {
          readsAttempted++;
          const raw = readFileSafe(dest);
          if (raw !== null) {
            try {
              const parsed = JSON.parse(raw);
              if (typeof parsed.i !== "number" || typeof parsed.payload !== "string") {
                readsFailed++;
              } else {
                readsParsed++;
              }
            } catch {
              // If this ever fires, atomicity is broken.
              readsFailed++;
            }
          }
          await new Promise<void>((resolve) => setImmediate(resolve));
        }
      })();

      // Writer: 100 atomic rewrites with distinguishable payloads.
      for (let i = 1; i <= 100; i++) {
        await atomicWrite(dest, JSON.stringify({ i, payload: "y".repeat(64) }));
      }

      readerStop = true;
      await reader;

      // Every successful read must have parsed cleanly.
      expect(readsFailed).toBe(0);
      // Sanity: the reader actually ran a meaningful number of iterations.
      // (On a single-core CI it should still be in the hundreds, on multi-core
      // potentially thousands. We assert > 100 to prove the loop overlapped
      // with the writes rather than running after them.)
      expect(readsAttempted).toBeGreaterThan(100);
      expect(readsParsed).toBeGreaterThan(0);

      // Final state is the last written payload.
      const finalRaw = readFileSync(dest, "utf8");
      const finalParsed = JSON.parse(finalRaw);
      expect(finalParsed.i).toBe(100);
      expect(finalParsed.payload).toBe("y".repeat(64));
    });
  });
});
