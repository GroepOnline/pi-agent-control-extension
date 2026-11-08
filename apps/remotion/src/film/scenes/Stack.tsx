import {Easing, Interactive, interpolate, useCurrentFrame} from "remotion";
import {Canvas, Eyebrow, Footer, SceneIn, Stage, Title} from "../shell";
import {theme, type} from "../theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const rows = [
  {id: "wishcraft", what: "Operator layer"},
  {id: "orchestrator", what: "Parallel agents"},
  {id: "tools", what: "Local search"},
  {id: "missions", what: "Durable tracks"},
  {id: "control", what: "Harness surface"},
] as const;

export const Stack: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Canvas>
      <SceneIn>
        <Stage>
          <Eyebrow index="00" label="The stack" />
          <Title>What we ship for Pi.</Title>
          <Interactive.Div
            name="Rows"
            style={{marginTop: 48, display: "flex", flexDirection: "column"}}
          >
            {rows.map((row, i) => {
              const from = 18 + i * 10;
              return (
                <Interactive.Div
                  key={row.id}
                  name={row.id}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    padding: "22px 0",
                    borderBottom: `1px solid ${theme.line}`,
                    opacity: interpolate(frame, [from, from + 12], [0, 1], {
                      ...clamp,
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    }),
                    translate: interpolate(
                      frame,
                      [from, from + 14],
                      ["0px 12px", "0px 0px"],
                      {
                        ...clamp,
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      },
                    ),
                  }}
                >
                  <Interactive.Span
                    name="Id"
                    style={{
                      fontFamily: type.mono,
                      fontSize: 28,
                      fontWeight: 500,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {row.id}
                  </Interactive.Span>
                  <Interactive.Span
                    name="What"
                    style={{
                      color: theme.muted,
                      fontSize: 26,
                    }}
                  >
                    {row.what}
                  </Interactive.Span>
                </Interactive.Div>
              );
            })}
          </Interactive.Div>
          <Footer packageId="pi install npm:@groeponline/…" />
        </Stage>
      </SceneIn>
    </Canvas>
  );
};
