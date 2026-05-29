import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { palettes } from '../lib/palettes';
import type { NarratorProps } from '../schema/narrator.schema';
import { Keystrokes } from '../components/Keystrokes';
import { CodeAnnotations } from '../components/CodeAnnotations';
import { TitleCard } from '../components/TitleCard';
import { EffectLayer } from '../components/EffectLayer';
import { TransitionLayer } from '../components/TransitionLayer';

// Simple provenance footer (reused pattern)
const ProvenanceFooter: React.FC<{ runId?: string; palette: any }> = ({ runId, palette }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 32,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      color: palette.muted,
      fontSize: 18,
      fontFamily: 'Inter, system-ui, sans-serif',
      opacity: 0.85,
    }}
  >
    {runId ? `${runId}  •  ` : ''}Autonomous Cinematic Narrator v0.2 (Keystrokes + CodeAnnotations)
  </div>
);

export const NarratorShowcaseComposition: React.FC<NarratorProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Normalize preset aliases
  const normalizedPreset =
    props.preset === 'pi-warm' ? 'warm'
      : props.preset === 'pi-hero' ? 'warm-hero'
      : props.preset || 'warm';

  const palette = palettes[normalizedPreset] ?? palettes['warm'];

  const durationTarget = props.durationTargetSec ?? 60;
  const totalFrames = Math.round(durationTarget * fps);
  const time = frame / fps; // seconds into the video

  const chapters = props.chapters || [];
  const chapterCount = Math.max(1, chapters.length);
  const chapterDuration = totalFrames / chapterCount;

  // Current chapter based on time
  const currentChapterIndex = Math.min(
    chapterCount - 1,
    Math.floor((frame / totalFrames) * chapterCount)
  );
  const currentChapter = chapters[currentChapterIndex];

  // Simple title card for first ~8% of duration
  const titleDuration = Math.max(3, durationTarget * 0.08);
  const isTitle = time < titleDuration;
  const titleOpacity = isTitle
    ? interpolate(time, [0, titleDuration * 0.2, titleDuration * 0.8, titleDuration], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  // EffectLayer reuse (high-leverage expansion: consume real-props effects + richer overlay handling from existing component)
  const effectsForLayer = (props.effects || []).map((e: any) => ({
    type: e.type || e,
    t: e.t ?? 0,
    dur: e.dur ?? 2,
    dim: e.dim,
    on: e.on,
    text: e.text,
    at: e.at,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>
      {/* Title Card (reusing TitleCard component for further polish) */}
      <TitleCard
        props={{
          title: props.runId || 'Autonomous Cinematic Narrator',
          subtitle: props.preset ? `${props.preset.toUpperCase()} PRESET • 4 Features` : '4 Features • tuistory recipe',
          speedNote: 'Evidence Capture',
        } as any}
        palette={palette}
        visible={isTitle}
      />

      {/* Main Content Area */}
      {!isTitle && (
        <AbsoluteFill style={{ padding: 80 }}>
          {/* Current Chapter */}
          {currentChapter && (
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: palette.text,
                marginBottom: 24,
              }}
            >
              {currentChapter.title}
            </div>
          )}

          {/* Chapter list / timeline (simple vertical list for v0.2) */}
          {chapters.length > 0 && (
            <div style={{ marginTop: 40 }}>
              {chapters.map((chapter, idx) => {
                const isActive = idx === currentChapterIndex;
                return (
                  <div
                    key={chapter.id || idx}
                    style={{
                      marginBottom: 22,
                      paddingLeft: 12,
                      borderLeft: isActive ? `4px solid ${palette.accent}` : '4px solid transparent',
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 600, color: palette.text }}>
                      {chapter.title}
                    </div>
                    <div style={{ fontSize: 20, color: palette.muted, marginTop: 4 }}>
                      ~{chapter.durationHintSec || Math.round(durationTarget / chapterCount)}s • tuistory driver • overlays: {(props.overlays && Object.keys(props.overlays).join(',')) || 'provenance'} • keystrokes/codeAnnotations active • transitions: {(props.transitions && props.transitions.join(',')) || 'motion-blur'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Keystrokes/CodeAnnotations from real 4-chapter props (further polish) */}
          <Keystrokes
            keys={chapters.slice(0,4).map((ch, i) => ({ label: (ch.title || '').split('(')[0].trim().toLowerCase() || ['tuistory','guards','evidence','router'][i], t: 8 + i*10, dur: 2.5 }))}
            time={time}
            palette={palette}
          />
          <CodeAnnotations
            items={[{ t: 22, dur: 6, code: 'tuistory launches must include --env FORCE_COLOR=3 --env COLORTERM=truecolor', language: 'bash', position: 'bottom-left' }]}
            time={time}
            palette={palette}
          />
        </AbsoluteFill>
      )}

      {/* Effect overlays (reusing EffectLayer for richer real-props support) */}
      <EffectLayer effects={effectsForLayer} time={time} palette={palette} />

      {/* TransitionLayer reuse (further polish: consume real-props transitions + vary by chapter) */}
      <TransitionLayer transitionStyle={(props.transitions && props.transitions[currentChapterIndex]) || ['motion-blur','fade','light-leak'][currentChapterIndex % 3] || 'fade'} active={!isTitle || currentChapterIndex > 0} frame={frame} />

      {/* Provenance footer (richer for 4 features + git + iter) */}
      <ProvenanceFooter runId={props.runId ? `${props.runId} • 4 features • tuistory recipe • d1ac426 • iter41` : '4 features • tuistory recipe • d1ac426 • iter41'} palette={palette} />
    </AbsoluteFill>
  );
};