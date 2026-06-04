import React from 'react';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';
import { opacityWindow } from '../lib/opacityWindow';

export const Keystrokes: React.FC<{ keys: ShowcaseProps['keys']; time: number; palette: Palette }> = ({ keys, time, palette }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
    {keys.map((key, index) => {
      const op = opacityWindow(time, key.t, key.dur ?? 1.2);
      if (op <= 0) return null;
      return (
        <div key={`${key.label}-${index}`} style={{ opacity: op, padding: '13px 20px', borderRadius: 999, background: 'rgba(0,0,0,0.72)', color: palette.text, border: `1px solid ${palette.border}`, fontSize: 22, fontWeight: 800, boxShadow: `0 12px 38px ${palette.shadow}` }}>
          {key.label}
        </div>
      );
    })}
  </div>
);
