import {CommandRow, Canvas, Eyebrow, Footer, Line, SceneIn, Stage, Title} from "../shell";

export const Orchestrator: React.FC = () => {
  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="02" label="Orchestrator" />
          <Title>Many agents. One surface.</Title>
          <Line>
            Isolated worktrees, bounded swarms, and a live dashboard. No hosted
            control plane.
          </Line>
          <div style={{marginTop: 56}}>
            <CommandRow
              from={24}
              command="/agents"
              hint="Steer, inspect, and stop the running set"
            />
            <CommandRow
              from={36}
              command="/orchestra-audit"
              hint="Packaged audit workflow on a real tree"
            />
            <CommandRow
              from={48}
              command="worktrees"
              hint="Each agent gets its own checkout"
            />
          </div>
          <Footer packageId="npm:@groeponline/pi-agent-orchestrator" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
