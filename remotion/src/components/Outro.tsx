import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Palette } from '../lib/palettes';

export const Outro: React.FC<{ palette: Palette; visible: boolean }> = ({ palette, visible }) => (
  <AbsoluteFill style={{ opacity: visible ? 1 : 0, background: palette.bg, color: palette.text, alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
    <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 8, color: palette.accent }}>VERIFIED</div>
  </AbsoluteFill>
);
