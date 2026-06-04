import React from 'react';
import type { Palette } from '../lib/palettes';

export const WindowChrome: React.FC<{ title?: string; palette: Palette; children: React.ReactNode; minimal: boolean }> = ({ title, palette, children, minimal }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: minimal ? 10 : 22,
      overflow: 'hidden',
      background: palette.panel,
      border: `1px solid ${palette.border}`,
      boxShadow: `0 32px 120px ${palette.shadow}`,
    }}
  >
    {!minimal && (
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 15 }}>
        <span style={{ width: 12, height: 12, borderRadius: 99, background: '#ff5f57', marginRight: 8 }} />
        <span style={{ width: 12, height: 12, borderRadius: 99, background: '#febc2e', marginRight: 8 }} />
        <span style={{ width: 12, height: 12, borderRadius: 99, background: '#28c840', marginRight: 18 }} />
        <span>{title ?? 'agent-control demo'}</span>
      </div>
    )}
    <div style={{ height: minimal ? '100%' : 'calc(100% - 44px)', position: 'relative' }}>{children}</div>
  </div>
);
