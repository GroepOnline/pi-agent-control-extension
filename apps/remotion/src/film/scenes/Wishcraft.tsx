import {CommandRow, Canvas, Eyebrow, Footer, Line, SceneIn, Stage, Title} from "../shell";

export const Wishcraft: React.FC = () => {
  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="01" label="Wishcraft" />
          <Title>The operator layer.</Title>
          <Line>
            Signal on the bar. A deck for settings. An inbox that does not
            interrupt the run.
          </Line>
          <div style={{marginTop: 56}}>
            <CommandRow
              from={24}
              command="/signal"
              hint="Three-lane status: model, activity, context"
            />
            <CommandRow
              from={36}
              command="alt+p"
              hint="Deck: session, skills, ideas, appearance"
            />
            <CommandRow
              from={48}
              command="# idea"
              hint="Park a thought without sending the prompt"
            />
          </div>
          <Footer packageId="npm:@groeponline/pi-wishcraft" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
