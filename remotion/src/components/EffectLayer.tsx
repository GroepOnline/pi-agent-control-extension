import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';
import { opacityWindow } from '../lib/opacityWindow';
import { asCss } from '../lib/asCss';

export const EffectLayer: React.FC<{ effects: ShowcaseProps['effects']; time: number; palette: Palette; fps?: number }> = ({ effects, time, palette, fps = 30 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {effects.map((effect, index) => {
      const type = effect.type ?? 'fade-in';
      const opacity = opacityWindow(time, effect.t, effect.dur);
      if (opacity <= 0) return null;
      if (type === 'spotlight' && effect.on) {
        return (
          <AbsoluteFill key={index} style={{ background: `rgba(0,0,0,${effect.dim ?? 0.58})`, opacity }}>
            <div style={{ position: 'absolute', left: asCss(effect.on.x, '40%'), top: asCss(effect.on.y, '40%'), width: asCss(effect.on.w, '20%'), height: asCss(effect.on.h, '20%'), boxShadow: `0 0 0 9999px rgba(0,0,0,${effect.dim ?? 0.58}), 0 0 0 3px ${palette.accent}`, borderRadius: 18 }} />
          </AbsoluteFill>
        );
      }
      if (type === 'callout') {
        return <div key={index} style={{ position: 'absolute', left: asCss(effect.at?.x, '50%'), top: asCss(effect.at?.y, '50%'), opacity, padding: '14px 18px', borderRadius: 16, background: palette.accent, color: '#111', fontSize: 24, fontWeight: 900 }}>{effect.text}</div>;
      }
      if (type === 'fade-in') return <AbsoluteFill key={index} style={{ background: '#000', opacity: 1 - opacity }} />;
      if (type === 'fade-out') return <AbsoluteFill key={index} style={{ background: '#000', opacity }} />;
      if (type === 'zoom' && effect.on) {
        const progress = Math.min(1, (time - effect.t) / effect.dur);
        const scale = 1 + progress * 0.3;
        const left = asCss(effect.on.x, '40%');
        const top = asCss(effect.on.y, '40%');
        const w = asCss(effect.on.w, '20%');
        const h = asCss(effect.on.h, '20%');
        return (
          <AbsoluteFill key={index} style={{ opacity }}>
            <div style={{ position: 'absolute', left, top, width: w, height: h, border: `3px solid ${palette.accent}`, borderRadius: 18, transform: `scale(${scale})`, transformOrigin: 'center', boxShadow: `0 0 20px ${palette.shadow}` }} />
          </AbsoluteFill>
        );
      }
      if (type === 'shake') {
        const shake = Math.sin(time * 1.5) * 4;
        return <AbsoluteFill key={index} style={{ transform: `translateX(${shake}px)`, opacity }} />;
      }
      if (type === 'pulse') {
        const pulse = interpolate(time % fps, [0, fps / 2, fps], [1, 1.08, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <AbsoluteFill key={index} style={{ opacity: opacity * 0.4 }}>
            <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${40 * pulse}px ${palette.accent}` }} />
          </AbsoluteFill>
        );
      }
      if (type === 'border') {
        return (
          <AbsoluteFill key={index} style={{ opacity }}>
            <div style={{ position: 'absolute', inset: 0, border: `4px solid ${palette.accent}`, borderRadius: 12, pointerEvents: 'none' }} />
          </AbsoluteFill>
        );
      }
      return null;
    })}
  </AbsoluteFill>
);
