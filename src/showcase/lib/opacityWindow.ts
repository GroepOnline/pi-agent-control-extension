import { interpolate } from 'remotion';

export const opacityWindow = (time: number, start: number, dur: number): number => {
  if (time < start || time > start + dur) return 0;
  const fade = Math.min(0.25, dur / 3);
  if (time < start + fade) return interpolate(time, [start, start + fade], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (time > start + dur - fade) return interpolate(time, [start + dur - fade, start + dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return 1;
};
