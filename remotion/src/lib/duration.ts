import type { ShowcaseProps } from '../compositions/Showcase';

export const TITLE_SECONDS = 2.5;
export const OUTRO_SECONDS = 1.5;
export const DEFAULT_CLIP_SECONDS = 20;

export const calculateShowcaseDuration = (props: ShowcaseProps, fps: number): number => {
  const clipSeconds = Math.max(1, props.clipDuration ?? DEFAULT_CLIP_SECONDS);
  return Math.ceil((TITLE_SECONDS + clipSeconds + OUTRO_SECONDS) * fps);
};
