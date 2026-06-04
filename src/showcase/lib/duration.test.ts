import { describe, it, expect } from 'vitest';
import {
  calculateShowcaseDuration,
  TITLE_SECONDS,
  OUTRO_SECONDS,
  DEFAULT_CLIP_SECONDS
} from './duration.js';
import type { ShowcaseProps } from '../schema/showcase.schema.js';

describe('duration', () => {
  describe('calculateShowcaseDuration', () => {
    it('calculates duration correctly with default clip duration', () => {
      const props = {} as ShowcaseProps;
      const fps = 30;
      // TITLE (2.5s) + DEFAULT_CLIP (20s) + OUTRO (1.5s) = 24s * 30fps = 720
      expect(calculateShowcaseDuration(props, fps)).toBe(720);
    });

    it('calculates duration correctly with provided clip duration', () => {
      const props = { clipDuration: 10 } as ShowcaseProps;
      const fps = 60;
      // TITLE (2.5s) + CLIP (10s) + OUTRO (1.5s) = 14s * 60fps = 840
      expect(calculateShowcaseDuration(props, fps)).toBe(840);
    });

    it('enforces a minimum clip duration of 1 second', () => {
      const props = { clipDuration: 0.5 } as ShowcaseProps;
      const fps = 30;
      // TITLE (2.5s) + MIN_CLIP (1s) + OUTRO (1.5s) = 5s * 30fps = 150
      expect(calculateShowcaseDuration(props, fps)).toBe(150);
    });

    it('handles negative clip durations by falling back to 1 second minimum', () => {
      const props = { clipDuration: -5 } as ShowcaseProps;
      const fps = 30;
      // TITLE (2.5s) + MIN_CLIP (1s) + OUTRO (1.5s) = 5s * 30fps = 150
      expect(calculateShowcaseDuration(props, fps)).toBe(150);
    });

    it('rounds up fractional frame durations', () => {
      // 10.01s clip duration at 30 fps
      const props = { clipDuration: 10.01 } as ShowcaseProps;
      const fps = 30;
      // TITLE (2.5s) + CLIP (10.01s) + OUTRO (1.5s) = 14.01s
      // 14.01s * 30fps = 420.3 frames -> rounds up to 421 frames
      expect(calculateShowcaseDuration(props, fps)).toBe(421);
    });
  });
});
