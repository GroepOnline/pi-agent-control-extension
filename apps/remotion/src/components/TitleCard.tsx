import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';

export const TitleCard: React.FC<{ props: ShowcaseProps; palette: Palette; visible: boolean }> = ({ props, palette, visible }) => {
  const frame = useCurrentFrame();
  const opacity = visible
    ? interpolate(frame, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill
      style={{
        opacity,
        background: `radial-gradient(circle at 70% 20%, ${palette.panel2}, transparent 34%), ${palette.bg}`,
        color: palette.text,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 96,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1180, textAlign: 'center' }}>
        <div style={{ color: palette.accent, fontSize: 24, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 28 }}>Evidence capture</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, textWrap: 'balance' }}>{props.title}</div>
        {props.subtitle ? <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: palette.muted }}>{props.subtitle}</div> : null}
        {props.speedNote ? <div style={{ marginTop: 36, fontSize: 22, color: palette.accent }}>{props.speedNote}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
