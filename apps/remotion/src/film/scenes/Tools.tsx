import {CommandRow, Canvas, Eyebrow, Footer, Line, SceneIn, Stage, Title} from "../shell";

export const Tools: React.FC = () => {
  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="03" label="Tools" />
          <Title>Find the file. Then the line.</Title>
          <Line>
            FFF-ranked path search and content grep, indexed locally. Built for
            repeated exploration, not one-shot greps.
          </Line>
          <div style={{marginTop: 56}}>
            <CommandRow
              from={24}
              command="fffind"
              hint="Fuzzy paths from a fragment or a concept"
            />
            <CommandRow
              from={36}
              command="ffgrep"
              hint="Smart-case content search, ranked locally"
            />
            <CommandRow
              from={48}
              command="@ file"
              hint="FFF-backed completion in the editor"
            />
          </div>
          <Footer packageId="npm:@groeponline/pi-tools" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
