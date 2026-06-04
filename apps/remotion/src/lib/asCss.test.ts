import { describe, it, expect } from 'vitest';
import { asCss } from './asCss';

describe('asCss', () => {
  it('converts number to percentage', () => {
    expect(asCss(50, '100%')).toBe('50%');
    expect(asCss(0, '100%')).toBe('0%');
    expect(asCss(-10, '100%')).toBe('-10%');
  });

  it('returns string as-is', () => {
    expect(asCss('20px', '100%')).toBe('20px');
    expect(asCss('auto', '100%')).toBe('auto');
    expect(asCss('calc(100% - 20px)', '100%')).toBe('calc(100% - 20px)');
  });

  it('returns fallback for undefined', () => {
    expect(asCss(undefined, '100%')).toBe('100%');
    expect(asCss(undefined, 'auto')).toBe('auto');
  });
});
