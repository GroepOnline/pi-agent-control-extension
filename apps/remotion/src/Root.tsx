import { Composition } from 'remotion';
import { ShowcaseComposition, showcaseSchema } from './compositions/Showcase';
import { NarratorShowcaseComposition } from './compositions/NarratorShowcase';
import { calculateShowcaseDuration } from './lib/duration';
import { narratorSchema } from './schema/narrator.schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Showcase"
        component={ShowcaseComposition}
        schema={showcaseSchema}
        calculateMetadata={async ({ props }) => {
          const fps = 30;
          return {
            durationInFrames: calculateShowcaseDuration(props, fps),
            fps,
            width: props.width ?? 1920,
            height: props.height ?? 1080,
          };
        }}
        defaultProps={{
          clips: [],
          layout: 'single' as const,
          labels: [],
          title: 'Demo',
          subtitle: '',
          preset: 'warm' as const,
          keys: [],
          effects: [],
          width: 1920,
          height: 1080,
        }}
      />

      {/* New dedicated composition for the Autonomous Cinematic Narrator (Feature 4) */}
      <Composition
        id="NarratorShowcase"
        component={NarratorShowcaseComposition}
        schema={narratorSchema}
        calculateMetadata={async ({ props }) => {
          const fps = 30;
          const durationSec = props.durationTargetSec ?? 60;
          return {
            durationInFrames: Math.round(durationSec * fps),
            fps,
            width: 1920,
            height: 1080,
          };
        }}
        defaultProps={{
          runId: 'demo-run',
          preset: 'pi-warm',
          durationTargetSec: 60,
          chapters: [],
        }}
      />
    </>
  );
};
