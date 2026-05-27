import React from 'react';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';
import { opacityWindow } from '../lib/opacityWindow';

export const Sections: React.FC<{ sections: ShowcaseProps['sections']; time: number; palette: Palette }> = ({ sections = [], time, palette }) => {
  const current = [...sections].reverse().find((section) => time >= section.t);
  if (!current) return null;
  const opacity = opacityWindow(time, current.t, 2.2);
  return (
    <div style={{ position: 'absolute', top: 78, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity }}>
      <div style={{ padding: '12px 18px', borderRadius: 16, background: palette.accent, color: '#111', fontSize: 22, fontWeight: 900 }}>{current.title}</div>
    </div>
  );
};
