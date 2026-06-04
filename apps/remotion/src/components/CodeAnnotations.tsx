import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Highlight } from 'prism-react-renderer';
import type { Palette } from '../lib/palettes';
import type { ShowcaseProps } from '../schema/showcase.schema';
import { opacityWindow } from '../lib/opacityWindow';

import type { PrismTheme } from 'prism-react-renderer';

const codeTheme: PrismTheme = {
  plain: { color: '#e4e4e7' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#a1a1aa', fontStyle: 'italic' } },
    { types: ['namespace'], style: { opacity: 0.7 } },
    { types: ['string', 'attr-value'], style: { color: '#a5d6ff' } },
    { types: ['punctuation', 'operator'], style: { color: '#d4d4d8' } },
    { types: ['keyword', 'builtin', 'tag'], style: { color: '#f472b6' } },
    { types: ['function', 'class-name', 'symbol'], style: { color: '#fbbf24' } },
    { types: ['number', 'boolean', 'regex'], style: { color: '#a78bfa' } },
    { types: ['property', 'constant'], style: { color: '#34d399' } },
  ],
};

export const CodeAnnotations: React.FC<{ items: ShowcaseProps['codeAnnotations']; time: number; palette: Palette }> = ({ items = [], time, palette }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {items.map((item, index) => {
      const opacity = opacityWindow(time, item.t, item.dur);
      if (opacity <= 0) return null;
      const position = item.position ?? 'top-right';
      const pos: React.CSSProperties = position === 'center' ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } : position === 'bottom-left' ? { left: 64, bottom: 64 } : { right: 64, top: 90 };
      return (
        <div key={index} style={{ position: 'absolute', ...pos, opacity, width: 560, borderRadius: 22, background: 'rgba(10,10,14,0.88)', border: `1px solid ${palette.border}`, color: palette.text, overflow: 'hidden', boxShadow: `0 28px 80px ${palette.shadow}` }}>
          {item.title ? <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontSize: 16, fontWeight: 800 }}>{item.title}</div> : null}
          <Highlight code={item.code} language={item.language || 'typescript'} theme={codeTheme}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={className} style={{ ...style, margin: 0, padding: 18, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 17, lineHeight: 1.42, whiteSpace: 'pre-wrap', background: 'transparent' }}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line, key: i })} style={{ background: 'transparent' }}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      );
    })}
  </AbsoluteFill>
);
