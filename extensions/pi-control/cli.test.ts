import { describe, it, expect } from 'vitest';
import { parseSkillMd } from './cli.ts';

describe('parseSkillMd', () => {
  it('should parse basic name and description', () => {
    const input = `name: test-skill\ndescription: A test skill`;
    expect(parseSkillMd(input)).toEqual({
      name: 'test-skill',
      description: 'A test skill'
    });
  });

  it('should parse values with extra whitespace', () => {
    const input = `name:    whitespace-skill   \ndescription: \t  A skill with whitespace   `;
    expect(parseSkillMd(input)).toEqual({
      name: 'whitespace-skill',
      description: 'A skill with whitespace'
    });
  });

  it('should strip single and double quotes from values', () => {
    const input = `name: "quoted-skill"\ndescription: 'A quoted description'`;
    expect(parseSkillMd(input)).toEqual({
      name: 'quoted-skill',
      description: 'A quoted description'
    });
  });

  it('should return empty strings when fields are missing', () => {
    const input = `some-other-field: foo`;
    expect(parseSkillMd(input)).toEqual({
      name: '',
      description: ''
    });
  });

  it('should handle multiline content and ignore irrelevant text', () => {
    const input = `
---
name: multi-skill
version: 1.0.0
description: A skill amidst other text
---
# Content goes here
    `;
    expect(parseSkillMd(input)).toEqual({
      name: 'multi-skill',
      description: 'A skill amidst other text'
    });
  });

  it('should handle partial fields (name only)', () => {
    const input = `name: just-name`;
    expect(parseSkillMd(input)).toEqual({
      name: 'just-name',
      description: ''
    });
  });

  it('should handle partial fields (description only)', () => {
    const input = `description: just-desc`;
    expect(parseSkillMd(input)).toEqual({
      name: '',
      description: 'just-desc'
    });
  });
});
