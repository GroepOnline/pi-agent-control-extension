import { describe, it, expect } from 'vitest';
import {
  calculateShowcaseDuration,
  TITLE_SECONDS,
  OUTRO_SECONDS,
  DEFAULT_CLIP_SECONDS
} from './duration';
import type { ShowcaseProps } from '../compositions/Showcase';

describe('duration', () => {
  describe('calculateShowcaseDuration', () => {
    it('calculates duration correctly with default clip duration', () => {
      const props = {} as ShowcaseProps;
      const fps = 30;

      const expectedSeconds = TITLE_SECONDS + DEFAULT_CLIP_SECONDS + OUTRO_SECONDS;
      const expectedFrames = Math.ceil(expectedSeconds * fps);

      expect(calculateShowcaseDuration(props, fps)).toBe(expectedFrames);
    });

    it('calculates duration correctly with provided clip duration', () => {
      const props = { clipDuration: 10 } as ShowcaseProps;
      const fps = 60;

      const expectedSeconds = TITLE_SECONDS + 10 + OUTRO_SECONDS;
      const expectedFrames = Math.ceil(expectedSeconds * fps);

      expect(calculateShowcaseDuration(props, fps)).toBe(expectedFrames);
    });

    it('enforces a minimum clip duration of 1 second', () => {
      const props = { clipDuration: 0.5 } as ShowcaseProps;
      const fps = 30;

      const expectedSeconds = TITLE_SECONDS + 1 + OUTRO_SECONDS;
      const expectedFrames = Math.ceil(expectedSeconds * fps);

      expect(calculateShowcaseDuration(props, fps)).toBe(expectedFrames);
    });

    it('handles negative clip durations by falling back to 1 second minimum', () => {
      const props = { clipDuration: -5 } as ShowcaseProps;
      const fps = 30;

      const expectedSeconds = TITLE_SECONDS + 1 + OUTRO_SECONDS;
      const expectedFrames = Math.ceil(expectedSeconds * fps);

      expect(calculateShowcaseDuration(props, fps)).toBe(expectedFrames);
    });
  });
});
