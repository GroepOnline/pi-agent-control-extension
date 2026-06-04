import {
  open,
  writeFile as writeFileAsync,
  rename as renameAsync,
  stat as statAsync,
  unlink as unlinkAsync,
  mkdir as mkdirAsync,
  readdir as readdirAsync,
  type FileHandle,
} from "node:fs/promises";
import {
  openSync,
  writeFileSync,
  renameSync,
  statSync,
  unlinkSync,
  mkdirSync,
  fsyncSync,
  closeSync,
  readdirSync,
  type Dirent,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Atomic write utilities.
 *
 * The pattern is: write to a temp file in the same directory, fsync the temp
 * file, rename it over the destination, then fsync the parent directory for
 * POSIX durability. This protects against:
 *   - Partial writes if the process crashes mid-write
 *   - Lost data when the kernel buffer has not been flushed
 *   - Concurrent readers seeing partial content (POSIX rename atomicity)
 *
 * Used by saveMergeState, saveDisabledSet, ensureToken, and resolveMerge so
 * that config files, the disabled-skill registry, and the bridge token are
 * never observed in a torn or empty state.
 */

const DEFAULT_MODE = 0o644;
const DEFAULT_ENCODING: BufferEncoding = "utf8";

/**
 * Build a temp file path in the same directory as the destination.
 * The pid + random suffix prevents collisions between concurrent writers
 * and across process restarts where a stale .tmp may still exist.
 */
function buildTempPath(filePath: string): string {
  const suffix = randomBytes(6).toString("hex");
  return `${filePath}.${process.pid}.${suffix}.tmp`;
}

/**
 * Best-effort fsync of a directory. POSIX guarantees that a directory
 * entry is durable only after the directory itself is fsynced. Not all
 * platforms support this (Windows, some FUSE mounts), so failures are
 * silently ignored — they are a durability optimization, not a
 * correctness requirement.
 */
async function fsyncDir(dirPath: string): Promise<void> {
  let handle: FileHandle | null = null;
  try {
    handle = await open(dirPath, "r");
    await handle.sync();
  } catch {
    // Ignore — see function doc.
  } finally {
    if (handle) await handle.close();
  }
}

function fsyncDirSync(dirPath: string): void {
  let fd: number | null = null;
  try {
    fd = openSync(dirPath, "r");
    fsyncSync(fd);
  } catch {
    // Ignore — see fsyncDir doc.
  } finally {
    if (fd !== null) {
      try { closeSync(fd); } catch { /* ignore */ }
    }
  }
}

export interface AtomicWriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
}

/**
 * Atomically write data to a file. Guarantees:
 * 1. The file is written to a temp file in the same directory first
 * 2. fsync is called to flush the data to disk
 * 3. The temp file is renamed over the destination
 * 4. The parent directory is fsync'd (POSIX durability, best-effort)
 *
 * This protects against:
 * - Partial writes (process crash mid-write)
 * - Lost data (kernel buffer not flushed)
 * - Concurrent readers seeing partial content
 *
 * @param filePath - Absolute path to destination file
 * @param data - String content to write
 * @param options.encoding - Defaults to 'utf8'
 * @param options.mode - File mode (e.g., 0o600 for secrets). Defaults to 0o644.
 */
export async function atomicWrite(
  filePath: string,
  data: string,
  options?: AtomicWriteOptions
): Promise<void> {
  const encoding: BufferEncoding = options?.encoding ?? DEFAULT_ENCODING;
  const mode: number = options?.mode ?? DEFAULT_MODE;

  const dir = dirname(filePath);
  await mkdirAsync(dir, { recursive: true });

  const tmpPath = buildTempPath(filePath);
  let handle: FileHandle | null = null;
  try {
    handle = await open(tmpPath, "w", mode);
    await writeFileAsync(handle, data, { encoding });
    await handle.sync();
    await handle.close();
    handle = null;
    await renameAsync(tmpPath, filePath);
    await fsyncDir(dir);
  } catch (err) {
    if (handle) {
      try { await handle.close(); } catch { /* ignore */ }
    }
    try { await unlinkAsync(tmpPath); } catch { /* ignore — may not exist */ }
    throw err;
  }
}

/**
 * Synchronous variant of atomicWrite. Same guarantees, suitable for
 * callers that cannot use async (e.g., synchronous code paths inside
 * the bridge or skill-merge modules).
 */
export function atomicWriteSync(
  filePath: string,
  data: string,
  options?: AtomicWriteOptions
): void {
  const encoding: BufferEncoding = options?.encoding ?? DEFAULT_ENCODING;
  const mode: number = options?.mode ?? DEFAULT_MODE;

  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const tmpPath = buildTempPath(filePath);
  let fd: number | null = null;
  try {
    fd = openSync(tmpPath, "w", mode);
    writeFileSync(fd, data, { encoding });
    fsyncSync(fd);
    // Close the fd before rename — some platforms reject rename with open handle.
    closeSync(fd);
    fd = null;
    renameSync(tmpPath, filePath);
    fsyncDirSync(dir);
  } catch (err) {
    if (fd !== null) {
      try { closeSync(fd); } catch { /* ignore */ }
    }
    try { unlinkSync(tmpPath); } catch { /* ignore — may not exist */ }
    throw err;
  }
}

/**
 * Remove files within a directory (recursively) whose name matches the
 * supplied pattern. Used by the startup cleanup pass to evict stale
 * `.tmp.<pid>` files left behind by crashed processes. If no pattern
 * is provided, defaults to `/\.tmp\.\d+$/` — the temp file suffix used
 * by atomicWrite.
 *
 * Returns the number of files removed.
 */
export async function cleanupDir(dir: string, pattern: RegExp = /\.tmp\.\d+$/): Promise<number> {
  let entries: Dirent[];
  try {
    entries = await readdirAsync(dir, { withFileTypes: true });
  } catch {
    // Directory doesn't exist or is unreadable — nothing to clean.
    return 0;
  }

  let removed = 0;
  for (const entry of entries) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) {
      removed += await cleanupDir(fp, pattern);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      try {
        await unlinkAsync(fp);
        removed++;
      } catch {
        // Best-effort: skip files we cannot remove.
      }
    }
  }
  return removed;
}

// Re-export stat helpers for tests that verify mode preservation.
export { statAsync, statSync };
