import { interpolate } from 'remotion';
import type { ShowcaseProps } from '../schema/showcase.schema';
import { asCss } from '../lib/asCss';

export const activeZoom = (effects: ShowcaseProps['effects'], time: number): React.CSSProperties => {
  const zoom = effects.find((effect) => (effect.type ?? 'fade-in') === 'zoom' && time >= effect.t && time <= effect.t + effect.dur && effect.to);
  if (!zoom?.to) return {};
  const progress = interpolate(time, [zoom.t, zoom.t + zoom.dur * 0.3, zoom.t + zoom.dur * 0.7, zoom.t + zoom.dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return {
    transform: `scale(${1 + progress * 0.18})`,
    transformOrigin: `${asCss(zoom.to.x, '50%')} ${asCss(zoom.to.y, '50%')}`,
  };
};
