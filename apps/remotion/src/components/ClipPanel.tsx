import React from 'react';
import { Video, staticFile } from 'remotion';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';

export const ClipPanel: React.FC<{ clip?: string; label?: string; palette: Palette; objectFit: ShowcaseProps['objectFit'] }> = ({ clip, label, palette, objectFit }) => (
  <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: '#000' }}>
    {clip ? (
      <Video src={staticFile(clip)} style={{ width: '100%', height: '100%', objectFit: objectFit ?? 'contain', background: '#000' }} />
    ) : (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.muted, fontSize: 28 }}>No clip staged</div>
    )}
    {label ? (
      <div style={{ position: 'absolute', left: 18, top: 18, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.6)', color: palette.text, fontSize: 17, fontWeight: 700, letterSpacing: 0.5 }}>
        {label}
      </div>
    ) : null}
  </div>
);
