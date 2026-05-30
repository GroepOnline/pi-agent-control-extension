import { describe, it, expect } from 'vitest';
import { opacityWindow } from './opacityWindow';

describe('opacityWindow', () => {
  it('returns 0 before start time', () => {
    expect(opacityWindow(0, 1, 3)).toBe(0);
    expect(opacityWindow(0.9, 1, 3)).toBe(0);
  });

  it('returns 0 after the window duration', () => {
    expect(opacityWindow(4.1, 1, 3)).toBe(0);
    expect(opacityWindow(5, 1, 3)).toBe(0);
  });

  it('returns 1 in the middle of the window', () => {
    // window is 1 to 4.
    // fade is min(0.25, 3/3) = 0.25
    // fade in: 1 to 1.25
    // fade out: 3.75 to 4
    // middle: 1.25 to 3.75
    expect(opacityWindow(1.25, 1, 3)).toBe(1);
    expect(opacityWindow(2.5, 1, 3)).toBe(1);
    expect(opacityWindow(3.75, 1, 3)).toBe(1);
  });

  it('interpolates fade-in correctly', () => {
    // window is 1 to 4, fade in is 1 to 1.25
    expect(opacityWindow(1, 1, 3)).toBe(0);
    expect(opacityWindow(1.125, 1, 3)).toBe(0.5); // exactly halfway
  });

  it('interpolates fade-out correctly', () => {
    // window is 1 to 4, fade out is 3.75 to 4
    expect(opacityWindow(3.75, 1, 3)).toBe(1);
    expect(opacityWindow(3.875, 1, 3)).toBe(0.5); // exactly halfway
    expect(opacityWindow(4, 1, 3)).toBe(0);
  });

  it('handles short durations correctly (dur < 0.75)', () => {
    // dur = 0.6. fade = min(0.25, 0.6/3) = 0.2.
    // window: 1 to 1.6
    // fade in: 1 to 1.2
    // fade out: 1.4 to 1.6
    // middle: 1.2 to 1.4

    // fade in
    expect(opacityWindow(1, 1, 0.6)).toBe(0);
    expect(opacityWindow(1.1, 1, 0.6)).toBeCloseTo(0.5);
    expect(opacityWindow(1.2, 1, 0.6)).toBe(1);

    // middle
    expect(opacityWindow(1.3, 1, 0.6)).toBe(1);

    // fade out
    expect(opacityWindow(1.4, 1, 0.6)).toBe(1);
    expect(opacityWindow(1.5, 1, 0.6)).toBeCloseTo(0.5);
    expect(opacityWindow(1.6, 1, 0.6)).toBe(0);
  });

  it('handles zero duration correctly', () => {
    // When time == start, time < start is false, time > start + 0 is false.
    // fade = 0.
    // time < start + fade is false (1 < 1 is false).
    // time > start + dur - fade is false (1 > 1 is false).
    // so it returns 1.
    expect(opacityWindow(1, 1, 0)).toBe(1);
  });
});
