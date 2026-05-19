import React from 'react';
import { AbsoluteFill, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { TITLE_SECONDS, OUTRO_SECONDS, DEFAULT_CLIP_SECONDS } from '../lib/duration';

const pctBox = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.union([z.string(), z.number()]),
  w: z.union([z.string(), z.number()]),
  h: z.union([z.string(), z.number()]),
});

const keystrokeSchema = z.object({
  t: z.number(),
  label: z.string(),
  dur: z.number().optional(),
});

const sectionSchema = z.object({
  t: z.number(),
  title: z.string(),
});

const effectSchema = z.object({
  type: z.enum(['fade-in', 'fade-out', 'zoom', 'spotlight', 'callout']).optional(),
  t: z.number(),
  dur: z.number(),
  to: pctBox.optional(),
  on: pctBox.optional(),
  dim: z.number().optional(),
  text: z.string().optional(),
  at: z.object({ x: z.union([z.string(), z.number()]), y: z.union([z.string(), z.number()]) }).optional(),
});

const codeAnnotationSchema = z.object({
  t: z.number(),
  dur: z.number(),
  code: z.string(),
  language: z.string().optional(),
  title: z.string().optional(),
  highlight: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
  focus: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
  position: z.enum(['top-right', 'center', 'bottom-left']).optional(),
});

export const showcaseSchema = z.object({
  clips: z.array(z.string()),
  layout: z.enum(['single', 'side-by-side']),
  fidelity: z.enum(['auto', 'compact', 'standard', 'inspect']).optional(),
  labels: z.array(z.string()),
  speed: z.number().optional(),
  title: z.string(),
  subtitle: z.string(),
  preset: z.enum(['factory', 'factory-hero', 'hero', 'macos', 'presentation', 'minimal']),
  keys: z.array(keystrokeSchema),
  sections: z.array(sectionSchema).optional(),
  effects: z.array(effectSchema),
  clipDuration: z.number().optional(),
  speedNote: z.string().optional(),
  windowTitle: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
  codeAnnotations: z.array(codeAnnotationSchema).optional(),
  transitionStyle: z.enum(['motion-blur', 'flash', 'whip-pan', 'light-leak', 'glitch-lite']).optional(),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;

type Palette = {
  bg: string;
  panel: string;
  panel2: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  shadow: string;
};

const palettes: Record<ShowcaseProps['preset'], Palette> = {
  factory: { bg: '#181818', panel: '#111111', panel2: '#1f1712', text: '#f4e8dc', muted: '#c5ad98', accent: '#ee6018', border: '#3a2a22', shadow: 'rgba(238,96,24,0.28)' },
  'factory-hero': { bg: '#20130d', panel: '#111111', panel2: '#2c160a', text: '#fff3e8', muted: '#d3b89e', accent: '#ee6018', border: '#4a2a18', shadow: 'rgba(238,96,24,0.38)' },
  hero: { bg: '#11111b', panel: '#181825', panel2: '#1e1e2e', text: '#f5e0dc', muted: '#cdd6f4', accent: '#89b4fa', border: '#313244', shadow: 'rgba(137,180,250,0.25)' },
  macos: { bg: '#0b0b12', panel: '#11111b', panel2: '#181825', text: '#cdd6f4', muted: '#a6adc8', accent: '#89b4fa', border: '#313244', shadow: 'rgba(0,0,0,0.5)' },
  presentation: { bg: '#000000', panel: '#111111', panel2: '#1b1b1b', text: '#ffffff', muted: '#b8b8b8', accent: '#89b4fa', border: '#2c2c2c', shadow: 'rgba(0,0,0,0.6)' },
  minimal: { bg: '#0b0b0f', panel: '#0f0f14', panel2: '#14141a', text: '#e8e8ea', muted: '#a0a0aa', accent: '#89b4fa', border: '#24242c', shadow: 'rgba(0,0,0,0.3)' },
};

const asCss = (value: string | number | undefined, fallback: string): string => {
  if (typeof value === 'number') return `${value}%`;
  return value ?? fallback;
};

const opacityWindow = (time: number, start: number, dur: number): number => {
  if (time < start || time > start + dur) return 0;
  const fade = Math.min(0.25, dur / 3);
  if (time < start + fade) return interpolate(time, [start, start + fade], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (time > start + dur - fade) return interpolate(time, [start + dur - fade, start + dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return 1;
};

const activeZoom = (effects: ShowcaseProps['effects'], time: number): React.CSSProperties => {
  const zoom = effects.find((effect) => (effect.type ?? 'fade-in') === 'zoom' && time >= effect.t && time <= effect.t + effect.dur && effect.to);
  if (!zoom?.to) return {};
  const progress = interpolate(time, [zoom.t, zoom.t + zoom.dur * 0.3, zoom.t + zoom.dur * 0.7, zoom.t + zoom.dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return {
    transform: `scale(${1 + progress * 0.18})`,
    transformOrigin: `${asCss(zoom.to.x, '50%')} ${asCss(zoom.to.y, '50%')}`,
  };
};

const TitleCard: React.FC<{ props: ShowcaseProps; palette: Palette; visible: boolean }> = ({ props, palette, visible }) => (
  <AbsoluteFill
    style={{
      opacity: visible ? 1 : 0,
      transition: 'opacity 120ms linear',
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

const WindowChrome: React.FC<{ title?: string; palette: Palette; children: React.ReactNode; minimal: boolean }> = ({ title, palette, children, minimal }) => (
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

const ClipPanel: React.FC<{ clip?: string; label?: string; palette: Palette; objectFit: ShowcaseProps['objectFit'] }> = ({ clip, label, palette, objectFit }) => (
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

const Keystrokes: React.FC<{ keys: ShowcaseProps['keys']; time: number; palette: Palette }> = ({ keys, time, palette }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
    {keys.map((key, index) => {
      const opacity = opacityWindow(time, key.t, key.dur ?? 1.2);
      if (opacity <= 0) return null;
      return (
        <div key={`${key.label}-${index}`} style={{ opacity, padding: '13px 20px', borderRadius: 999, background: 'rgba(0,0,0,0.72)', color: palette.text, border: `1px solid ${palette.border}`, fontSize: 22, fontWeight: 800, boxShadow: `0 12px 38px ${palette.shadow}` }}>
          {key.label}
        </div>
      );
    })}
  </div>
);

const Sections: React.FC<{ sections: ShowcaseProps['sections']; time: number; palette: Palette }> = ({ sections = [], time, palette }) => {
  const current = [...sections].reverse().find((section) => time >= section.t);
  if (!current) return null;
  const opacity = opacityWindow(time, current.t, 2.2);
  return (
    <div style={{ position: 'absolute', top: 78, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity }}>
      <div style={{ padding: '12px 18px', borderRadius: 16, background: palette.accent, color: '#111', fontSize: 22, fontWeight: 900 }}>{current.title}</div>
    </div>
  );
};

const EffectLayer: React.FC<{ effects: ShowcaseProps['effects']; time: number; palette: Palette }> = ({ effects, time, palette }) => (
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
      return null;
    })}
  </AbsoluteFill>
);

const CodeAnnotations: React.FC<{ items: ShowcaseProps['codeAnnotations']; time: number; palette: Palette }> = ({ items = [], time, palette }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {items.map((item, index) => {
      const opacity = opacityWindow(time, item.t, item.dur);
      if (opacity <= 0) return null;
      const position = item.position ?? 'top-right';
      const pos: React.CSSProperties = position === 'center' ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } : position === 'bottom-left' ? { left: 64, bottom: 64 } : { right: 64, top: 90 };
      return (
        <div key={index} style={{ position: 'absolute', ...pos, opacity, width: 560, borderRadius: 22, background: 'rgba(10,10,14,0.88)', border: `1px solid ${palette.border}`, color: palette.text, overflow: 'hidden', boxShadow: `0 28px 80px ${palette.shadow}` }}>
          {item.title ? <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontSize: 16, fontWeight: 800 }}>{item.title}</div> : null}
          <pre style={{ margin: 0, padding: 18, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 17, lineHeight: 1.42, whiteSpace: 'pre-wrap' }}>{item.code}</pre>
        </div>
      );
    })}
  </AbsoluteFill>
);

const Outro: React.FC<{ palette: Palette; visible: boolean }> = ({ palette, visible }) => (
  <AbsoluteFill style={{ opacity: visible ? 1 : 0, background: palette.bg, color: palette.text, alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
    <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 8, color: palette.accent }}>VERIFIED</div>
  </AbsoluteFill>
);

export const ShowcaseComposition: React.FC<ShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = palettes[props.preset];
  const titleFrames = Math.round(TITLE_SECONDS * fps);
  const clipFrames = Math.round((props.clipDuration ?? DEFAULT_CLIP_SECONDS) * fps);
  const contentFrame = Math.max(0, frame - titleFrames);
  const time = contentFrame / fps;
  const isTitle = frame < titleFrames;
  const isOutro = frame >= titleFrames + clipFrames;
  const minimal = props.preset === 'minimal';
  const margin = props.preset === 'minimal' ? 32 : props.preset === 'presentation' ? 96 : 72;
  const contentOpacity = isTitle ? interpolate(frame, [titleFrames - 12, titleFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : isOutro ? interpolate(frame, [titleFrames + clipFrames, titleFrames + clipFrames + 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 20% 15%, ${palette.panel2}, transparent 28%), ${palette.bg}` }}>
      <AbsoluteFill style={{ padding: margin, opacity: contentOpacity }}>
        <WindowChrome title={props.windowTitle} palette={palette} minimal={minimal}>
          <div style={{ height: '100%', display: 'flex', gap: props.layout === 'side-by-side' ? 18 : 0, ...activeZoom(props.effects, time) }}>
            <ClipPanel clip={props.clips[0]} label={props.labels[0]} palette={palette} objectFit={props.objectFit} />
            {props.layout === 'side-by-side' ? <ClipPanel clip={props.clips[1]} label={props.labels[1]} palette={palette} objectFit={props.objectFit} /> : null}
          </div>
        </WindowChrome>
      </AbsoluteFill>
      <Sections sections={props.sections} time={time} palette={palette} />
      <Keystrokes keys={props.keys} time={time} palette={palette} />
      <CodeAnnotations items={props.codeAnnotations} time={time} palette={palette} />
      <EffectLayer effects={props.effects} time={time} palette={palette} />
      <TitleCard props={props} palette={palette} visible={isTitle} />
      <Outro palette={palette} visible={isOutro} />
    </AbsoluteFill>
  );
};
