import { describe, it, expect } from 'vitest';
import { parseSkillMd } from './cli.ts';

describe('parseSkillMd', () => {
  it('should parse valid name and description', () => {
    const text = `
name: My Skill
description: A useful skill
    `;
    const result = parseSkillMd(text);
    expect(result).toEqual({ name: 'My Skill', description: 'A useful skill' });
  });

  it('should handle quotes', () => {
    const text = `
name: "Quoted Skill"
description: 'Single Quoted Description'
    `;
    const result = parseSkillMd(text);
    expect(result).toEqual({ name: 'Quoted Skill', description: 'Single Quoted Description' });
  });

  it('should handle missing name and description gracefully', () => {
    const text = `
other: info
    `;
    const result = parseSkillMd(text);
    expect(result).toEqual({ name: '', description: '' });
  });

  it('should trim whitespace', () => {
    const text = `
name:   Spaces Skill
description: 	Tabs Description
    `;
    const result = parseSkillMd(text);
    expect(result).toEqual({ name: 'Spaces Skill', description: 'Tabs Description' });
  });

  it('should only remove quotes at the start and end of the string', () => {
    const text = `
name: "Skill "with" quotes"
description: 'Description 'with' quotes'
    `;
    const result = parseSkillMd(text);
    expect(result).toEqual({ name: 'Skill "with" quotes', description: "Description 'with' quotes" });
  });
});
