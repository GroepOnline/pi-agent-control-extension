import { describe, it, expect } from 'vitest';
import { opacityWindow } from './opacityWindow';

describe('opacityWindow', () => {
  describe('Out of bounds', () => {
    it('returns 0 before the start time', () => {
      expect(opacityWindow(-1, 0, 1)).toBe(0);
      expect(opacityWindow(0.5, 1, 1)).toBe(0);
      expect(opacityWindow(9.999, 10, 5)).toBe(0);
    });

    it('returns 0 after the end time', () => {
      expect(opacityWindow(2, 0, 1)).toBe(0);
      expect(opacityWindow(3, 1, 1)).toBe(0);
      expect(opacityWindow(15.001, 10, 5)).toBe(0);
    });
  });

  describe('Long duration (fade clamped to 0.25)', () => {
    const start = 0;
    const dur = 1;
    // fade = Math.min(0.25, 1/3) = 0.25

    it('fades in during the fade-in period', () => {
      expect(opacityWindow(0, start, dur)).toBe(0);
      expect(opacityWindow(0.125, start, dur)).toBe(0.5);
      expect(opacityWindow(0.25, start, dur)).toBe(1);
    });

    it('is fully opaque in the middle', () => {
      expect(opacityWindow(0.251, start, dur)).toBe(1);
      expect(opacityWindow(0.5, start, dur)).toBe(1);
      expect(opacityWindow(0.749, start, dur)).toBe(1);
    });

    it('fades out during the fade-out period', () => {
      expect(opacityWindow(0.75, start, dur)).toBe(1);
      expect(opacityWindow(0.875, start, dur)).toBe(0.5);
      expect(opacityWindow(1, start, dur)).toBe(0);
    });
  });

  describe('Short duration (fade is dur / 3)', () => {
    const start = 10;
    const dur = 0.6;
    // fade = Math.min(0.25, 0.6 / 3) = 0.2

    it('fades in during the fade-in period', () => {
      expect(opacityWindow(10, start, dur)).toBe(0);
      expect(opacityWindow(10.1, start, dur)).toBeCloseTo(0.5);
      expect(opacityWindow(10.2, start, dur)).toBe(1);
    });

    it('is fully opaque in the middle', () => {
      expect(opacityWindow(10.201, start, dur)).toBe(1);
      expect(opacityWindow(10.3, start, dur)).toBe(1);
      expect(opacityWindow(10.399, start, dur)).toBe(1);
    });

    it('fades out during the fade-out period', () => {
      expect(opacityWindow(10.4, start, dur)).toBe(1);
      expect(opacityWindow(10.5, start, dur)).toBeCloseTo(0.5);
      expect(opacityWindow(10.6, start, dur)).toBe(0);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('handles exactly zero duration', () => {
      // dur = 0 -> fade = 0
      // time < start || time > start + dur (0) -> returns 0
      // when time == start:
      // fade = 0
      // time < start + fade (0 < 0 is false)
      // time > start + dur - fade (0 > 0 is false)
      // returns 1
      expect(opacityWindow(0, 0, 0)).toBe(1);
      expect(opacityWindow(-0.1, 0, 0)).toBe(0);
      expect(opacityWindow(0.1, 0, 0)).toBe(0);
    });

    it('handles negative duration gracefully', () => {
      // dur = -1 -> fade = -0.333
      // time = 0, start = 0, dur = -1
      // time > start + dur (0 > -1 is true) -> returns 0
      expect(opacityWindow(0, 0, -1)).toBe(0);
      expect(opacityWindow(-0.5, 0, -1)).toBe(0);
      expect(opacityWindow(-1, 0, -1)).toBe(0);
      expect(opacityWindow(-1.5, 0, -1)).toBe(0);
    });

    it('handles interpolation boundaries correctly', () => {
      expect(opacityWindow(0.0000001, 0, 1)).toBeGreaterThan(0);
      expect(opacityWindow(0.0000001, 0, 1)).toBeLessThan(0.01);

      expect(opacityWindow(0.9999999, 0, 1)).toBeGreaterThan(0);
      expect(opacityWindow(0.9999999, 0, 1)).toBeLessThan(0.01);
    });

    it('handles non-zero start times', () => {
      // Fade is 0.25
      const start = 0.1;
      const dur = 1;
      expect(opacityWindow(start, start, dur)).toBe(0);
      expect(opacityWindow(start + 0.25, start, dur)).toBe(1);
      expect(opacityWindow(start + 0.75, start, dur)).toBe(1);
      expect(opacityWindow(start + 1, start, dur)).toBe(0);
    });
  });
});
