export type SkillSource = 'user' | 'pi';
export type ShadowState = 'overrides' | 'shadowed' | null;

export type SkillEntry = {
  name: string;
  description: string;
  path: string;
  source: SkillSource;
  sourceDir: string;
  enabled: boolean;
  valid: 'ok' | 'warn' | 'error';
  mtime: Date;
  shadowState: ShadowState;
};

export type FocusPane = 'list' | 'detail' | 'actions' | 'evidence';

/** Source-dir priority when the same skill name lives in several user trees
 * (e.g. ~/.agents/skills + vendored copy in ~/.claude/skills).
 * ~/.agents/skills is the ChefGroep portable mesh SSOT, so it wins. */
const USER_DIR_PRIORITY: Record<string, number> = { global: 0, devin: 1, claude: 2 };

/** Collapse user-skill entries with the same name to one row, keeping the
 * entry from the highest-priority user dir. PI-bundled entries and the
 * user-overrides-pi shadow semantics are untouched. */
export function dedupeUserSkills(skills: SkillEntry[]): SkillEntry[] {
  const best = new Map<string, SkillEntry>();
  const out: SkillEntry[] = [];
  for (const s of skills) {
    if (s.source !== 'user') {
      out.push(s);
      continue;
    }
    const prev = best.get(s.name);
    if (!prev) {
      best.set(s.name, s);
      out.push(s);
      continue;
    }
    const prevRank = USER_DIR_PRIORITY[prev.sourceDir] ?? 9;
    const curRank = USER_DIR_PRIORITY[s.sourceDir] ?? 9;
    if (curRank < prevRank) {
      out[out.indexOf(prev)] = s;
      best.set(s.name, s);
    }
  }
  return out;
}
