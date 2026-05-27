import { useState, useMemo } from 'react';
import type { SkillEntry } from '../model/skill.ts';

export function useFilter(skills: SkillEntry[]) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return skills;
    const q = query.toLowerCase();
    return skills.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [skills, query]);

  return { query, setQuery, filtered };
}
