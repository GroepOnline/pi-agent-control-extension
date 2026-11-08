import {Easing, Interactive, interpolate, useCurrentFrame} from "remotion";
import {Canvas, SceneIn} from "../shell";
import {theme, type} from "../theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const Open: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Canvas>
      <SceneIn>
        <Interactive.Div
          name="Open stage"
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Interactive.Div
            name="Kicker"
            style={{
              color: theme.accentInk,
              fontFamily: type.mono,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: interpolate(frame, [6, 20], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            GroepOnline
          </Interactive.Div>
          <Interactive.Div
            name="Hero"
            style={{
              marginTop: 28,
              fontFamily: type.display,
              fontSize: 128,
              letterSpacing: "-0.035em",
              lineHeight: 0.92,
              opacity: interpolate(frame, [12, 32], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [12, 34], ["0px 24px", "0px 0px"], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            Pi, extended.
          </Interactive.Div>
          <Interactive.Div
            name="Sub"
            style={{
              marginTop: 32,
              maxWidth: 980,
              color: theme.muted,
              fontFamily: type.display,
              fontSize: 36,
              fontStyle: "italic",
              lineHeight: 1.3,
              opacity: interpolate(frame, [28, 48], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            Five packages. One cockpit. Stock Pi stays the engine.
          </Interactive.Div>
        </Interactive.Div>
      </SceneIn>
    </Canvas>
  );
};
