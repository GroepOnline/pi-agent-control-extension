import {CommandRow, Canvas, Eyebrow, Footer, Line, SceneIn, Stage, Title} from "../shell";

export const Missions: React.FC = () => {
  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="04" label="Missions" />
          <Title>The work survives the session.</Title>
          <Line>
            Plan, queue, evidence, and handoff stay on disk. Compaction and
            restarts do not wipe the track.
          </Line>
          <div style={{marginTop: 56}}>
            <CommandRow
              from={24}
              command="/mission start"
              hint="Open a durable execution track"
            />
            <CommandRow
              from={36}
              command="/mission status"
              hint="What is done, what is next, what is blocked"
            />
            <CommandRow
              from={48}
              command="/mission done"
              hint="Close a feature with evidence attached"
            />
          </div>
          <Footer packageId="npm:@groeponline/pi-missions" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
