import {CommandRow, Canvas, Eyebrow, Footer, Line, SceneIn, Stage, Title} from "../shell";

export const Control: React.FC = () => {
  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="05" label="Control" />
          <Title>The harness surface.</Title>
          <Line>
            Route a control task across terminal, browser, capture, and QA
            evidence. Pi stays the host.
          </Line>
          <div style={{marginTop: 56}}>
            <CommandRow
              from={24}
              command="/route-control"
              hint="Pick driver, skills, capture, recipe"
            />
            <CommandRow
              from={36}
              command="capture"
              hint="QA evidence bound to the run"
            />
            <CommandRow
              from={48}
              command="ACP"
              hint="Cursor, Claude, Codex on one surface"
            />
          </div>
          <Footer packageId="git:github.com/GroepOnline/pi-agent-control-extension" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
