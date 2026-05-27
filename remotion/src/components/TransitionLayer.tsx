import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ShowcaseProps } from '../schema/showcase.schema';
import type { Palette } from '../lib/palettes';

export const TransitionLayer: React.FC<{
  transitionStyle?: ShowcaseProps['transitionStyle'];
  active: boolean;
}> = ({ transitionStyle, active }) => {
  if (!active || !transitionStyle) return null;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durFrames = Math.round(0.4 * fps);

  switch (transitionStyle) {
    case 'flash': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <AbsoluteFill style={{ background: '#ffffff', opacity, pointerEvents: 'none' }} />;
    }
    case 'light-leak': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.35, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 15%, rgba(255,160,60,0.55) 0%, transparent 45%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 80%, rgba(200,100,50,0.35) 0%, transparent 40%)' }} />
        </AbsoluteFill>
      );
    }
    case 'whip-pan': {
      const progress = interpolate(frame, [0, durFrames], [-60, 60], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const blur = interpolate(frame, [0, durFrames / 2, durFrames], [0, 12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <AbsoluteFill style={{ transform: `translateX(${progress}px)`, filter: `blur(${blur}px)`, opacity: 1, pointerEvents: 'none' }} />;
    }
    case 'glitch-lite': {
      const flicker = Math.random() > 0.7 ? 0.7 : 1;
      const offsetX = frame % 3 === 0 ? 3 : frame % 5 === 0 ? -2 : 0;
      return (
        <AbsoluteFill style={{ opacity: active ? flicker : 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateX(${offsetX}px)`, filter: 'hue-rotate(20deg) saturate(1.4)' }} />
        </AbsoluteFill>
      );
    }
    case 'motion-blur': {
      const blur = interpolate(frame, [0, durFrames / 2, durFrames], [0, 10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const translateY = interpolate(frame, [0, durFrames], [-20, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <AbsoluteFill style={{ filter: `blur(${blur}px)`, transform: `translateY(${translateY}px)`, opacity: 1, pointerEvents: 'none' }} />;
    }
    case 'scan-line': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const lines = Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / 40) * 100}%`, height: '1px', background: 'rgba(0,255,100,0.15)' }} />
      ));
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none', overflow: 'hidden' }}>
          {lines}
        </AbsoluteFill>
      );
    }
    case 'vignette': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
        </AbsoluteFill>
      );
    }
    case 'grain': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const grain = Math.random() > 0.5 ? 0.08 : 0.15;
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${grain}'/%3E%3C/svg%3E")`, backgroundSize: '150px 150px' }} />
        </AbsoluteFill>
      );
    }
    case 'chromatic': {
      const shift = interpolate(frame, [0, durFrames / 2, durFrames], [0, 8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${-shift}px)`, background: 'rgba(255,0,0,0.15)' }} />
          <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${shift}px)`, background: 'rgba(0,255,255,0.15)' }} />
        </AbsoluteFill>
      );
    }
    case 'ripple': {
      const progress = interpolate(frame, [0, durFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const scale = 1 + progress * 0.5;
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`, background: 'radial-gradient(circle at 50% 50%, transparent 30%, #89b4fa 100%)', opacity: 0.2 }} />
        </AbsoluteFill>
      );
    }
    case 'pixelate': {
      const pixelSize = interpolate(frame, [0, durFrames / 2, durFrames], [1, 12, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.5, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none', filter: `blur(${pixelSize}px)` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(#111 0% 25%, transparent 0% 50%)', backgroundSize: `${pixelSize * 2}px ${pixelSize * 2}px`, mixBlendMode: 'overlay' }} />
        </AbsoluteFill>
      );
    }
    case 'blur-zoom': {
      const blur = interpolate(frame, [0, durFrames / 2, durFrames], [0, 15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const scale = interpolate(frame, [0, durFrames / 2, durFrames], [1, 1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <AbsoluteFill style={{ filter: `blur(${blur}px)`, transform: `scale(${scale})`, opacity: 1, pointerEvents: 'none' }} />;
    }
    case 'split': {
      const progress = interpolate(frame, [0, durFrames], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${progress}%`, height: '100%', background: '#111', opacity: 0.9 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: `${progress}%`, height: '100%', background: '#111', opacity: 0.9 }} />
        </AbsoluteFill>
      );
    }
    case 'radial-wipe': {
      const progress = interpolate(frame, [0, durFrames], [0, 360], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(from 0deg, transparent ${progress}deg, #111 ${progress}deg)`, opacity: 0.95 }} />
        </AbsoluteFill>
      );
    }
    case 'slide': {
      const translateX = interpolate(frame, [0, durFrames], [100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <AbsoluteFill style={{ transform: `translateX(${translateX}%)`, opacity, background: '#111', pointerEvents: 'none' }} />;
    }
    case 'mosaic': {
      const opacity = interpolate(frame, [0, durFrames / 2, durFrames], [0, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const tiles = Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const delay = (row + col) * 2;
          const tileOpacity = interpolate(frame, [delay, delay + durFrames / 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={`${row}-${col}`} style={{
              position: 'absolute',
              left: `${(col / 8) * 100}%`,
              top: `${(row / 6) * 100}%`,
              width: `${100 / 8}%`,
              height: `${100 / 6}%`,
              background: '#111',
              opacity: tileOpacity,
            }} />
          );
        })
      ).flat();
      return <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>{tiles}</AbsoluteFill>;
    }
    default:
      return null;
  }
};
