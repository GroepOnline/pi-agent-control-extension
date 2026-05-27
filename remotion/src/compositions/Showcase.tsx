import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { palettes } from '../lib/palettes';
import { TITLE_SECONDS, DEFAULT_CLIP_SECONDS } from '../lib/duration';
import { activeZoom } from '../components/ActiveZoom';
import { TitleCard } from '../components/TitleCard';
import { WindowChrome } from '../components/WindowChrome';
import { ClipPanel } from '../components/ClipPanel';
import { Keystrokes } from '../components/Keystrokes';
import { Sections } from '../components/Sections';
import { CodeAnnotations } from '../components/CodeAnnotations';
import { EffectLayer } from '../components/EffectLayer';
import { Outro } from '../components/Outro';
import { TransitionLayer } from '../components/TransitionLayer';
import { ProgressBar } from '../components/ProgressBar';
import type { ShowcaseProps } from '../schema/showcase.schema';

export { showcaseSchema } from '../schema/showcase.schema';
export type { ShowcaseProps } from '../schema/showcase.schema';

export const ShowcaseComposition: React.FC<ShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Normalize preset aliases (e.g. pi-warm -> warm)
  const normalizedPreset =
    props.preset === 'pi-warm' ? 'warm'
      : props.preset === 'pi-hero' ? 'warm-hero'
      : props.preset;

  const palette = palettes[normalizedPreset] ?? palettes['warm'];

  // Fidelity mode
  const fidelity = props.fidelity ?? 'standard';
  const isMinimal = normalizedPreset === 'minimal' || fidelity === 'compact';
  const margin = fidelity === 'compact' ? 24 : fidelity === 'inspect' ? 120 : normalizedPreset === 'minimal' ? 32 : normalizedPreset === 'presentation' ? 96 : 72;

  // Timing
  const clipSeconds = Math.max(1, props.clipDuration ?? DEFAULT_CLIP_SECONDS);
  const titleF = Math.round(TITLE_SECONDS * fps);
  const clipF = Math.round(clipSeconds * fps);
  const contentFrame = Math.max(0, frame - titleF);
  const time = contentFrame / fps;
  const isTitle = frame < titleF;
  const isOutro = frame >= titleF + clipF;
  const isClip = !isTitle && !isOutro;

  const contentOpacity = isTitle
    ? interpolate(frame, [titleF - 12, titleF], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : isOutro
      ? interpolate(frame, [titleF + clipF, titleF + clipF + 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1;

  // Progress (0-1) during clip
  const progress = isClip ? (frame - titleF) / clipF : isOutro ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 20% 15%, ${palette.panel2}, transparent 28%), ${palette.bg}`,
        width: props.width ? `${props.width}px` : '100%',
        height: props.height ? `${props.height}px` : '100%',
      }}
    >
      <AbsoluteFill style={{ padding: margin, opacity: contentOpacity }}>
        <WindowChrome title={props.windowTitle} palette={palette} minimal={isMinimal}>
          <div style={{ height: '100%', display: 'flex', gap: props.layout === 'side-by-side' ? 18 : 0, ...activeZoom(props.effects, time) }}>
            <ClipPanel clip={props.clips[0]} label={props.labels[0]} palette={palette} objectFit={props.objectFit} />
            {props.layout === 'side-by-side' ? <ClipPanel clip={props.clips[1]} label={props.labels[1]} palette={palette} objectFit={props.objectFit} /> : null}
          </div>
          {props.showProgress && <ProgressBar progress={progress} palette={palette} />}
        </WindowChrome>
      </AbsoluteFill>

      <Sections sections={props.sections} time={time} palette={palette} />
      <Keystrokes keys={props.keys} time={time} palette={palette} />
      <CodeAnnotations items={props.codeAnnotations} time={time} palette={palette} />
      <EffectLayer effects={props.effects} time={time} palette={palette} />
      <TransitionLayer transitionStyle={props.transitionStyle} active={isTitle || isOutro} />
      <TitleCard props={props} palette={palette} visible={isTitle} />
      <Outro palette={palette} visible={isOutro} />

      {/* Inspect fidelity: frame counter overlay */}
      {fidelity === 'inspect' && (
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '4px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: palette.accent, fontSize: 12, fontFamily: 'monospace' }}>
          frame {frame} | fps {fps} | time {time.toFixed(2)}s
        </div>
      )}
    </AbsoluteFill>
  );
};
