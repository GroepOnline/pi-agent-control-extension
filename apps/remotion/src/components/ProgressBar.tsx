import React from 'react';
import type { Palette } from '../lib/palettes';

export const ProgressBar: React.FC<{ progress: number; palette: Palette }> = ({ progress, palette }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      background: `${palette.border}44`,
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(100, progress * 100))}%`,
        height: '100%',
        background: palette.accent,
      }}
    />
  </div>
);
