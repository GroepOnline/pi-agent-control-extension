import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { existsSync, readdirSync, readFileSync, openSync, fstatSync, closeSync, mkdirSync, writeFileSync, watch } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { SkillEntry, SkillSource, ShadowState } from '../model/skill.ts';

const STUDIO_STATE_PATH = join(homedir(), '.config', 'devin', 'skill-studio.json');

function loadDisabledSet(): Set<string> {
  try {
    const raw = readFileSync(STUDIO_STATE_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.disabled)) return new Set(data.disabled);
  } catch { /* ignore */ }
  return new Set();
}

function saveDisabledSet(disabled: Set<string>) {
  try {
    mkdirSync(join(homedir(), '.config', 'devin'), { recursive: true });
    writeFileSync(STUDIO_STATE_PATH, JSON.stringify({ disabled: Array.from(disabled) }, null, 2));
  } catch { /* ignore */ }
}

function parseSkillMd(text: string): { name: string; description: string } {
  const nameMatch = text.match(/^name:\s*(.+)$/m);
  const descMatch = text.match(/^description:\s*(.+)$/m);
  return {
    name: (nameMatch?.[1] ?? '').trim().replace(/^['"]|['"]$/g, ''),
    description: (descMatch?.[1] ?? '').trim().replace(/^['"]|['"]$/g, ''),
  };
}

const skillCache = new Map<string, { mtimeMs: number; parsed: ReturnType<typeof parseSkillMd> }>();

function scanDir(dir: string, source: SkillSource, sourceLabel: string): SkillEntry[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => {
        const path = join(dir, d.name, 'SKILL.md');
        let fd: number;
        try {
          fd = openSync(path, 'r');
        } catch {
          return null;
        }
        try {
          const fileStat = fstatSync(fd);

          let parsed;
          const cached = skillCache.get(path);
          if (cached && cached.mtimeMs === fileStat.mtimeMs) {
            parsed = cached.parsed;
          } else {
            const text = readFileSync(fd, 'utf8');
            parsed = parseSkillMd(text);
            skillCache.set(path, { mtimeMs: fileStat.mtimeMs, parsed });
          }

          const hasName = parsed.name.length > 0;
          const hasDesc = parsed.description.length > 0;
          return {
            name: d.name,
            description: parsed.description || parsed.name || '',
            path,
            source,
            sourceDir: sourceLabel,
            enabled: true,
            valid: hasName && hasDesc ? 'ok' : hasName || hasDesc ? 'warn' : 'error',
            mtime: fileStat.mtime,
            shadowState: null,
          };
        } finally {
          closeSync(fd);
        }
      })
      .filter((entry): entry is SkillEntry => entry !== null);
  } catch {
    return [];
  }
}

function getRepoRoot(): string {
  const candidates = [process.cwd(), resolve(import.meta.dirname || '', '..', '..', '..')];
  for (const d of candidates) {
    if (existsSync(join(d, 'package.json'))) return d;
  }
  return process.cwd();
}

function buildRegistry(): SkillEntry[] {
  const repoRoot = getRepoRoot();
  const piSkills = scanDir(join(repoRoot, 'skills'), 'pi', 'pi');
  const userSkills = [
    ...scanDir(join(homedir(), '.agents', 'skills'), 'user', 'global'),
    ...scanDir(join(homedir(), '.devin', 'skills'), 'user', 'devin'),
    ...scanDir(join(homedir(), '.claude', 'skills'), 'user', 'claude'),
  ];

  const disabled = loadDisabledSet();

  const piMap = new Map(piSkills.map((s) => [s.name, s]));
  const userMap = new Map(userSkills.map((s) => [s.name, s]));

  const all: SkillEntry[] = [];

  // Process PI skills
  for (const skill of piSkills) {
    const isShadowed = userMap.has(skill.name);
    all.push({
      ...skill,
      enabled: !disabled.has(skill.name),
      shadowState: isShadowed ? 'shadowed' : null,
    });
  }

  // Process user skills
  for (const skill of userSkills) {
    const isOverride = piMap.has(skill.name);
    all.push({
      ...skill,
      enabled: !disabled.has(skill.name),
      shadowState: isOverride ? 'overrides' : null,
    });
  }

  // Sort: PI first, then by name
  all.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'pi' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return all;
}

function getWatchedDirs(): string[] {
  const repoRoot = getRepoRoot();
  return [
    join(repoRoot, 'skills'),
    join(homedir(), '.agents', 'skills'),
    join(homedir(), '.devin', 'skills'),
    join(homedir(), '.claude', 'skills'),
  ].filter(existsSync);
}

export function useSkillRegistry(onAutoReload?: () => void) {
  const [skills, setSkills] = useState<SkillEntry[]>(() => buildRegistry());
  const [disabled, setDisabled] = useState<Set<string>>(() => loadDisabledSet());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(() => {
    setSkills(buildRegistry());
  }, []);

  const toggle = useCallback((name: string) => {
    const next = new Set(disabled);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setDisabled(next);
    saveDisabledSet(next);
    setSkills((prev) =>
      prev.map((s) => (s.name === name ? { ...s, enabled: !next.has(name) } : s))
    );
  }, [disabled]);

  const userSkills = useMemo(() => skills.filter((s) => s.source === 'user'), [skills]);
  const piSkills = useMemo(() => skills.filter((s) => s.source === 'pi'), [skills]);

  // Auto-reload when skill directories change
  useEffect(() => {
    const dirs = getWatchedDirs();
    const watchers = dirs.map((dir) => {
      try {
        return watch(dir, { recursive: true }, () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            setSkills(buildRegistry());
            onAutoReload?.();
          }, 500);
        });
      } catch (err) {
        console.error(`Failed to watch directory ${dir}:`, err);
        return null;
      }
    }).filter((w): w is NonNullable<typeof w> => w !== null);
    return () => {
      watchers.forEach((w) => w.close());
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [onAutoReload]);

  return { skills, userSkills, piSkills, toggle, reload };
}
