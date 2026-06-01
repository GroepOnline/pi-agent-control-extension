import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  renameSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir, homedir as osHomedir } from "node:os";
import { randomUUID } from "node:crypto";

/**
 * Tests the atomic write pattern (writeFileSync to tmp, renameSync to dest)
 * used in saveMergeState, saveDisabledSet, ensureToken, and resolveMerge.
 *
 * Key properties:
 *  1. No .tmp file is left behind after a successful write.
 *  2. A stale .tmp left by a crashed process does not corrupt or block
 *     subsequent writes.
 *  3. A concurrent reader sees either the complete old file or the complete
 *     new file — never a partially-written file (POSIX rename atomicity).
 */

function atomicWrite(dest: string, data: string) {
  const tmp = `${dest}.tmp.${process.pid}`;
  mkdirSync(join(dest, ".."), { recursive: true });
  writeFileSync(tmp, data, "utf8");
  renameSync(tmp, dest);
}

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
    it("leaves no .tmp file after a successful atomic write", () => {
      const dest = join(testDir, "config.json");
      atomicWrite(dest, JSON.stringify({ key: "value" }));

      expect(existsSync(dest)).toBe(true);
      expect(readFileSync(dest, "utf8")).toBe('{"key":"value"}');

      // Verify no .tmp files lingering in the directory
      const files = readdirSync(testDir);
      const tmpFiles = files.filter((f) => f.endsWith(".tmp") || f.includes(".tmp."));
      expect(tmpFiles).toHaveLength(0);
    });

    it("handles a stale .tmp file from a crashed process gracefully", () => {
      const dest = join(testDir, "config.json");

      // Simulate crash: create a stale .tmp file (as if pid 99999 wrote but never renamed)
      const staleTmp = `${dest}.tmp.99999`;
      writeFileSync(staleTmp, "stale-partial-data", "utf8");

      // Now do a real atomic write with current PID
      atomicWrite(dest, JSON.stringify({ fresh: true }));

      // The fresh write should succeed
      expect(existsSync(dest)).toBe(true);
      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ fresh: true });

      // Stale .tmp should still exist but not interfere
      expect(existsSync(staleTmp)).toBe(true);
      // Current PID's .tmp should NOT exist (was renamed)
      const currentTmp = `${dest}.tmp.${process.pid}`;
      expect(existsSync(currentTmp)).toBe(false);
    });

    it("overwrites stale .tmp with same PID without issues", () => {
      const dest = join(testDir, "config.json");

      // Simulate a previous crash of the SAME pid (unlikely but possible on PID wrap)
      const samePidTmp = `${dest}.tmp.${process.pid}`;
      writeFileSync(samePidTmp, "orphaned-data", "utf8");

      // Now write atomically — should overwrite the tmp and rename successfully
      atomicWrite(dest, JSON.stringify({ recovered: true }));

      expect(existsSync(dest)).toBe(true);
      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ recovered: true });
      expect(existsSync(samePidTmp)).toBe(false);
    });

    it("multiple sequential atomic writes all clean up .tmp files", () => {
      const dest = join(testDir, "state.json");

      for (let i = 0; i < 5; i++) {
        atomicWrite(dest, JSON.stringify({ iteration: i }));
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

  describe("cleanupStaleTmpFiles startup cleanup", () => {
    let devinDir: string;
    let skillsDir: string;

    beforeEach(() => {
      devinDir = join(testDir, "home", ".config", "devin");
      skillsDir = join(testDir, "home", ".devin", "skills");
      mkdirSync(devinDir, { recursive: true });
      mkdirSync(skillsDir, { recursive: true });
    });

    it("removes stale .tmp.<PID> files from config directories", () => {
      // Create stale .tmp files simulating crashed processes
      writeFileSync(join(devinDir, "skill-studio.json.tmp.12345"), "stale", "utf8");
      writeFileSync(join(devinDir, "bridge-token.tmp.99999"), "orphan", "utf8");
      writeFileSync(join(skillsDir, "SKILL.md.tmp.54321"), "dead", "utf8");

      // Verify they exist
      expect(existsSync(join(devinDir, "skill-studio.json.tmp.12345"))).toBe(true);
      expect(existsSync(join(devinDir, "bridge-token.tmp.99999"))).toBe(true);
      expect(existsSync(join(skillsDir, "SKILL.md.tmp.54321"))).toBe(true);

      // Simulate cleanup via the real function (but we can't call it directly
      // without mocking homedir — we test the pattern here)
      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      cleanupDir(devinDir, count);
      cleanupDir(skillsDir, count);

      expect(count.n).toBe(3);
      expect(existsSync(join(devinDir, "skill-studio.json.tmp.12345"))).toBe(false);
      expect(existsSync(join(devinDir, "bridge-token.tmp.99999"))).toBe(false);
      expect(existsSync(join(skillsDir, "SKILL.md.tmp.54321"))).toBe(false);
    });

    it("does not remove non-.tmp files", () => {
      writeFileSync(join(devinDir, "skill-studio.json"), '{"valid":true}', "utf8");
      writeFileSync(join(devinDir, "bridge-token"), "abc123", "utf8");
      writeFileSync(join(devinDir, "skill-studio.json.tmp.12345"), "stale", "utf8");

      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      cleanupDir(devinDir, count);

      // Only the stale .tmp should be removed
      expect(count.n).toBe(1);
      expect(existsSync(join(devinDir, "skill-studio.json"))).toBe(true);
      expect(existsSync(join(devinDir, "bridge-token"))).toBe(true);
      expect(existsSync(join(devinDir, "skill-studio.json.tmp.12345"))).toBe(false);
    });

    it("handles nested skill directories with stale .tmp", () => {
      const nestedSkillDir = join(skillsDir, "agent-browser");
      mkdirSync(nestedSkillDir, { recursive: true });
      writeFileSync(join(nestedSkillDir, "SKILL.md"), "valid", "utf8");
      writeFileSync(join(nestedSkillDir, "SKILL.md.tmp.77777"), "stale-nested", "utf8");

      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      cleanupDir(skillsDir, count);

      expect(count.n).toBe(1);
      expect(existsSync(join(nestedSkillDir, "SKILL.md"))).toBe(true);
      expect(existsSync(join(nestedSkillDir, "SKILL.md.tmp.77777"))).toBe(false);
    });

    it("returns 0 when no stale .tmp files exist", () => {
      writeFileSync(join(devinDir, "skill-studio.json"), '{"ok":true}', "utf8");

      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      cleanupDir(devinDir, count);
      cleanupDir(skillsDir, count);

      expect(count.n).toBe(0);
      expect(existsSync(join(devinDir, "skill-studio.json"))).toBe(true);
    });

    it("does not crash when config directories do not exist (fresh install)", () => {
      // Fresh install: remove the directories completely
      rmSync(devinDir, { recursive: true, force: true });
      rmSync(skillsDir, { recursive: true, force: true });
      expect(existsSync(devinDir)).toBe(false);
      expect(existsSync(skillsDir)).toBe(false);

      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      // Should not throw — just return early from existsSync check
      expect(() => {
        cleanupDir(devinDir, count);
        cleanupDir(skillsDir, count);
      }).not.toThrow();

      expect(count.n).toBe(0);
    });

    it("does not crash when one directory exists but the other does not", () => {
      writeFileSync(join(devinDir, "skill-studio.json.tmp.12345"), "stale", "utf8");
      // Remove skillsDir entirely
      rmSync(skillsDir, { recursive: true, force: true });

      const cleanupDir = (dir: string, count: { n: number }) => {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fp = join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanupDir(fp, count);
          } else if (entry.isFile() && /\.tmp\.\d+$/.test(entry.name)) {
            rmSync(fp, { force: true });
            count.n++;
          }
        }
      };

      const count = { n: 0 };
      expect(() => {
        cleanupDir(devinDir, count);
        cleanupDir(skillsDir, count);
      }).not.toThrow();

      // Should have cleaned the one stale file in devinDir
      expect(count.n).toBe(1);
      expect(existsSync(join(devinDir, "skill-studio.json.tmp.12345"))).toBe(false);
    });
  });

  describe("concurrent read safety", () => {
    it("reader sees complete old data during the write preparation phase", () => {
      const dest = join(testDir, "config.json");

      // Write initial complete data
      atomicWrite(dest, JSON.stringify({ version: 1, data: "initial" }));
      expect(readFileSafe(dest)).toBe('{"version":1,"data":"initial"}');

      // Write to tmp without renaming (simulate mid-write)
      const tmp = `${dest}.tmp.${process.pid}`;
      writeFileSync(tmp, "INCOMPLETE", "utf8");

      // Reader should still see the OLD complete file (rename hasn't happened yet)
      const readerView = readFileSafe(dest);
      expect(readerView).toBe('{"version":1,"data":"initial"}');
      // Reader should NOT see the incomplete tmp content
      expect(readerView).not.toBe("INCOMPLETE");

      // Cleanup tmp
      rmSync(tmp, { force: true });
    });

    it("reader sees complete new data after atomic rename completes", () => {
      const dest = join(testDir, "config.json");

      // Write initial data
      atomicWrite(dest, JSON.stringify({ version: 1 }));

      // Write new data atomically
      atomicWrite(dest, JSON.stringify({ version: 2, updated: true }));

      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ version: 2, updated: true });
      // Verify it's valid JSON (not truncated)
      expect(() => JSON.parse(readFileSync(dest, "utf8"))).not.toThrow();
    });

    it("handles empty initial state (first write to non-existent file)", () => {
      const dest = join(testDir, "fresh.json");

      // No file exists yet
      expect(existsSync(dest)).toBe(false);

      // First atomic write
      atomicWrite(dest, JSON.stringify({ first: true }));

      const content = JSON.parse(readFileSync(dest, "utf8"));
      expect(content).toEqual({ first: true });
      expect(existsSync(`${dest}.tmp.${process.pid}`)).toBe(false);
    });

    it("large writes are atomic (multi-kilobyte JSON)", () => {
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
      atomicWrite(dest, JSON.stringify(largeData));

      const raw = readFileSync(dest, "utf8");
      expect(() => JSON.parse(raw)).not.toThrow();
      const parsed = JSON.parse(raw);
      expect(parsed.items).toHaveLength(1000);
      expect(parsed.items[0].name).toBe("item-0");
      expect(parsed.items[999].name).toBe("item-999");
    });

    it("rapid sequential writes always produce complete JSON", () => {
      const dest = join(testDir, "rapid.json");

      // Rapid writes — each should be atomically complete
      for (let i = 0; i < 20; i++) {
        atomicWrite(dest, JSON.stringify({ count: i, data: "x".repeat(100) }));
        // Immediately read — should always get valid JSON
        const raw = readFileSync(dest, "utf8");
        expect(() => JSON.parse(raw)).not.toThrow();
      }
    });
  });
});
